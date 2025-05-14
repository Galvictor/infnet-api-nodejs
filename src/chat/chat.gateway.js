const path = require('path');
const {verifyToken} = require('../auth/jwt');
const {
    getMessagesByRoom,
    addMessage,
    getAllMessages
} = require('../messages/messages.model');

const fs = require('fs/promises');
const clients = new Map();

// Utilitário para gerar nome de sala
function getRoomName(email1, email2) {
    return [email1, email2].sort().join('-');
}

// Atualiza o status de uma mensagem específica
async function updateMessageStatus(messageId, status) {
    const messages = await getAllMessages();
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
        msg.status = status;
        const messagesPath = path.join(__dirname, '../data/messages.json');
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
            clients.set(user.email, socket);
            next();
        } catch {
            next(new Error('Token inválido'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 ${socket.user.nome} conectado`);
        clients.set(socket.user.email, socket);

        io.emit('usuario_online', {
            email: socket.user.email,
            nome: socket.user.nome
        });

        socket.on('join_private_room', ({to}) => {
            const room = getRoomName(socket.user.email, to);
            socket.join(room);
            console.log(`📥 ${socket.user.email} entrou na sala ${room}`);
            socket.to(room).emit('usuario_entrou_na_sala', {
                email: socket.user.email,
                nome: socket.user.nome,
                room
            });
        });

        socket.on('leave_private_room', ({to}) => {
            const room = getRoomName(socket.user.email, to);
            socket.leave(room);
            console.log(`👋 ${socket.user.email} saiu da sala ${room}`);
            socket.to(room).emit('usuario_saiu_da_sala', {
                email: socket.user.email,
                nome: socket.user.nome,
                room
            });
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

            await addMessage(message);
            io.to(room).emit('receive_private_message', message);

            const targetSocket = clients.get(data.to);
            if (targetSocket) {
                message.status = 2; // Entregue
                await updateMessageStatus(message.id, 2);
                io.to(room).emit('message_status_updated', {
                    id: message.id,
                    status: 2
                });
            }
        });

        socket.on('mark_as_read', async ({from}) => {
            const room = getRoomName(socket.user.email, from);
            const messages = await getAllMessages();
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
                    io.to(room).emit('message_status_updated', {
                        id: msg.id,
                        status: 3
                    });
                }
            }

            if (updated) {
                const messagesPath = path.join(__dirname, '../data/messages.json');
                await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));
            }
        });

        socket.on('typing', ({to}) => {
            const room = getRoomName(socket.user.email, to);
            socket.to(room).emit('user_typing', {
                name: socket.user.nome
            });
        });

        socket.on('disconnect', () => {
            console.log(`❌ ${socket.user.nome} saiu`);
            clients.delete(socket.user.email);
            io.emit('usuario_offline', {
                email: socket.user.email,
                nome: socket.user.nome
            });
        });
    });
}

module.exports = startChat;
