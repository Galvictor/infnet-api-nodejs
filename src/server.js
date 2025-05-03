const http = require('http');
const {Server} = require('socket.io');
const app = require('./app');
const startChat = require('./chat/chat.gateway');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

startChat(io); // 👈 inicia o chat

// Escuta o servidor HTTP e WebSocket na mesma instância
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
