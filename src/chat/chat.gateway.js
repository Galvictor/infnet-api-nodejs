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

async function saveMessage(message) {
    const messages = await loadMessages();
    messages.push(message);
    await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));
}

async function updateMessageStatus(messageId, status) {
    const messages = await loadMessages();
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
        message.status = status;
        await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));
    }
}

function getRoomName(email1, email2) {
    return [email1, email2].sort().join('-');
}

function startChat(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Token ausente'));

        try {
            const user = verifyToken(token);
            socket.user = user;
            clients.set(user.email, socket); // usando email como chave única
            next();
        } catch {
            next(new Error('Token inválido'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 ${socket.user.nome} conectado`);

        socket.on('join_private_room', ({to}) => {
            const room = getRoomName(socket.user.email, to);
            socket.join(room);
            console.log(`📥 ${socket.user.email} entrou na sala ${room}`);
        });

        socket.on('send_private_message', async (data) => {
            const room = getRoomName(socket.user.email, data.to);
            const now = Date.now();

            if (
                clients.get(socket.user.email)?.lastMessage &&
                now - clients.get(socket.user.email).lastMessage < 2000
            ) {
                console.log(`⏱️ ${socket.user.nome} enviou mensagem muito rápido`);
                return;
            }

            clients.get(socket.user.email).lastMessage = now;

            const message = {
                id: now.toString(),
                from: socket.user.email,
                name: socket.user.nome,
                to: data.to,
                message: data.message,
                timestamp: new Date().toISOString(),
                status: 1, // Enviado
                room
            };

            await saveMessage(message);
            io.to(room).emit('receive_private_message', message);

            // Se destinatário estiver na sala, atualiza status para "entregue"
            const targetSocket = clients.get(data.to);
            if (targetSocket) {
                message.status = 2;
                await updateMessageStatus(message.id, 2);
                io.to(room).emit('message_status_updated', {id: message.id, status: 2});
            }
        });

        socket.on('mark_as_read', async ({from}) => {
            const room = getRoomName(socket.user.email, from);
            const messages = await loadMessages();
            let updated = false;

            for (const msg of messages) {
                if (
                    msg.from === from &&
                    msg.to === socket.user.email &&
                    msg.room === room &&
                    msg.status < 3
                ) {
                    msg.status = 3;
                    updated = true;
                    io.to(room).emit('message_status_updated', {id: msg.id, status: 3});
                }
            }

            if (updated) {
                await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));
            }
        });

        socket.on('typing', ({to}) => {
            const room = getRoomName(socket.user.email, to);
            socket.to(room).emit('user_typing', {name: socket.user.nome});
        });

        socket.on('disconnect', () => {
            console.log(`❌ ${socket.user.nome} saiu`);
            clients.delete(socket.user.email);
        });
    });
}

module.exports = startChat;
