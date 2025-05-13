const fs = require('fs/promises');
const path = require('path');
const {verifyToken} = require('../auth/jwt');

const messagesPath = path.join(__dirname, '../data/messages.json');
const clients = new Map(); // Um Map para armazenar os clientes conectados por email

// Função para carregar mensagens do arquivo JSON
async function loadMessages() {
    try {
        const data = await fs.readFile(messagesPath, 'utf8');
        return JSON.parse(data); // Retorna as mensagens como um array
    } catch {
        return []; // Retorna um array vazio se o arquivo não existir
    }
}

// Função para salvar uma mensagem no arquivo JSON
async function saveMessage(message) {
    const messages = await loadMessages(); // Carrega as mensagens existentes
    messages.push(message); // Adiciona a nova mensagem
    await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2)); // Salva o arquivo atualizado
}

// Função para atualizar o status de uma mensagem (ex: enviada, entregue, lida)
async function updateMessageStatus(messageId, status) {
    const messages = await loadMessages(); // Carrega todas as mensagens
    const message = messages.find(msg => msg.id === messageId); // Localiza a mensagem pelo ID
    if (message) {
        message.status = status; // Atualiza o status
        await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2)); // Salva as alterações
    }
}

// Função utilitária para criar um nome de sala único com base em dois emails
function getRoomName(email1, email2) {
    return [email1, email2].sort().join('-'); // Retorna os emails ordenados e concatenados
}

// Função principal para iniciar o sistema de chat com WebSocket
function startChat(io) {
    // Middleware para autenticação de socket
    io.use((socket, next) => {
        const token = socket.handshake.auth.token; // Obtém o token de autenticação

        if (!token) return next(new Error('Token ausente')); // Erro se o token não for fornecido

        try {
            const user = verifyToken(token); // Verifica e decodifica o token
            socket.user = user; // Associa o usuário ao socket
            clients.set(user.email, socket); // Armazena o socket no Map usando o email como chave
            next(); // Prossegue com a conexão
        } catch {
            next(new Error('Token inválido')); // Erro se o token for inválido
        }
    });

    // Gerenciamento de conexão de novos sockets
    io.on('connection', (socket) => {
        console.log(`🔌 ${socket.user.nome} conectado`); // Loga quando um cliente conecta

        // Sempre atualiza ou substitui o socket mais recente
        clients.set(socket.user.email, socket);

        // Notifica todos os sockets conectados que o usuário está online,
        // exceto o próprio usuário que acabou de conectar
        io.emit('usuario_online', {
            email: socket.user.email,
            nome: socket.user.nome
        });

        // Evento para entrar em uma sala privada
        socket.on('join_private_room', ({to}) => {
            const room = getRoomName(socket.user.email, to); // Obtem o nome da sala
            socket.join(room); // Usuário entra na sala
            console.log(`📥 ${socket.user.email} entrou na sala ${room}`);

            // Emite o evento "usuario_entrou_na_sala" para todos na sala (exceto o que entrou)
            socket.to(room).emit('usuario_entrou_na_sala', {
                email: socket.user.email,
                nome: socket.user.nome,
                room
            });
        });

        // Evento para sair de uma sala privada
        socket.on('leave_private_room', ({to}) => {
            const room = getRoomName(socket.user.email, to); // Obtém o nome da sala
            socket.leave(room); // Remove o usuário da sala
            console.log(`👋 ${socket.user.email} saiu da sala ${room}`);

            // Emite evento informando aos outros participantes que o usuário saiu
            socket.to(room).emit('usuario_saiu_da_sala', {
                email: socket.user.email,
                nome: socket.user.nome,
                room
            });
        });


        // Evento para enviar mensagens privadas
        socket.on('send_private_message', async (data) => {
            const room = getRoomName(socket.user.email, data.to); // Obtém o nome da sala
            const now = Date.now(); // Marca o momento atual

            // Verifica se a última mensagem enviada foi há menos de 2 segundos
            if (
                clients.get(socket.user.email)?.lastMessage &&
                now - clients.get(socket.user.email).lastMessage < 2000
            ) {
                console.log(`⏱️ ${socket.user.nome} enviou mensagem muito rápido`);
                return;
            }

            clients.get(socket.user.email).lastMessage = now; // Atualiza o horário da última mensagem

            // Cria mensagem com dados relevantes
            const message = {
                id: now.toString(),
                from: socket.user.email,
                name: socket.user.nome,
                to: data.to,
                message: data.message,
                timestamp: new Date().toISOString(),
                status: 1, // Status "Enviado"
                room
            };

            await saveMessage(message); // Salva a mensagem no arquivo
            io.to(room).emit('receive_private_message', message); // Envia a mensagem para todos na sala

            // Se o destinatário estiver conectado, atualiza status para "entregue"
            const targetSocket = clients.get(data.to);
            if (targetSocket) {
                message.status = 2; // Status "Entregue"
                await updateMessageStatus(message.id, 2); // Atualiza no arquivo
                io.to(room).emit('message_status_updated', {id: message.id, status: 2}); // Notifica a sala
            }
        });

        // Evento para marcar mensagens como lidas
        socket.on('mark_as_read', async ({from}) => {
            const room = getRoomName(socket.user.email, from); // Nome da sala correspondente
            const messages = await loadMessages(); // Carrega todas as mensagens
            let updated = false;

            // Atualiza o status das mensagens para "lido" (3)
            for (const msg of messages) {
                if (
                    msg.from === from &&
                    msg.to === socket.user.email &&
                    msg.room === room &&
                    msg.status < 3
                ) {
                    msg.status = 3; // Atualiza o status para "lido"
                    updated = true;
                    io.to(room).emit('message_status_updated', {id: msg.id, status: 3}); // Notifica a sala
                }
            }

            if (updated) {
                await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2)); // Salva as alterações
            }
        });

        // Evento para notificação de digitação
        socket.on('typing', ({to}) => {
            const room = getRoomName(socket.user.email, to); // Nome da sala
            socket.to(room).emit('user_typing', {name: socket.user.nome}); // Emite evento para outros na sala
        });

        // Evento de desconexão do cliente
        socket.on('disconnect', () => {
            console.log(`❌ ${socket.user.nome} saiu`); // Loga desconexão
            clients.delete(socket.user.email); // Remove o cliente do Map

            // Notifica todos os sockets conectados que o usuário ficou offline
            io.emit('usuario_offline', {
                email: socket.user.email,
                nome: socket.user.nome
            });

        });
    });
}

module.exports = startChat;