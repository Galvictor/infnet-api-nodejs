const fs = require('fs/promises');
const path = require('path');
const {verifyToken} = require('../auth/jwt');

const messagesPath = path.join(__dirname, '../data/messages.json');
const clients = new Map();

async function loadMessages() {
    try {
        const data = await fs.readFile(messagesPath, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function clearMessages() {
    try {
        await fs.writeFile(messagesPath, JSON.stringify([]));
    } catch (err) {
        console.error('Erro ao limpar mensagens:', err);
    }
}

async function saveMessage(message) {
    const messages = await loadMessages();
    messages.push(message);
    await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));
}

async function updateMessageStatus(messageId, status) {
    const messages = await loadMessages();
    const messageIndex = messages.findIndex(msg => msg.id === messageId);

    if (messageIndex !== -1) {
        messages[messageIndex].read = status;
        await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));
    }
}

function startChat(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Token ausente'));

        try {
            const user = verifyToken(token);
            socket.user = user;

            // Registra o cliente ao conectar
            clients.set(socket.user.id, {lastMessage: null});
            next();
        } catch (err) {
            next(new Error('Token inválido'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 ${socket.user.nome} conectado`);

        socket.on('send_message', async (data) => {
            const currentTime = Date.now();
            const clientInfo = clients.get(socket.user.id);

            // Bloqueia mensagens repetitivas em um intervalo curto (2 segundos)
            if (clientInfo && clientInfo.lastMessage && (currentTime - clientInfo.lastMessage < 2000)) {
                console.log(`❗️ Mensagem bloqueada: ${socket.user.nome} enviou uma mensagem muito rápido`);
                return;
            }

            clientInfo.lastMessage = currentTime;

            const message = {
                id: Date.now().toString(),
                from: socket.user.email,
                name: socket.user.nome,
                to: data.to || 'global',
                message: data.message,
                timestamp: new Date().toISOString(),
                read: false
            };

            await saveMessage(message);

            socket.emit('message_sent', message);
            socket.broadcast.emit('receive_message', message);
        });

        socket.on('typing', () => {
            socket.broadcast.emit('user_typing', {name: socket.user.nome});
        });

        socket.on('disconnect', () => {
            console.log(`❌ ${socket.user.nome} saiu`);
            clients.delete(socket.user.id); // Remove o cliente ao desconectar
        });
    });
}

module.exports = startChat;
