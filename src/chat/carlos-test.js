const { io } = require("socket.io-client");

async function getToken() {
    const email = 'carlos.oliveira@email.com';
    const password = 'senhaSegura123';

    const url = 'http://localhost:3000/users/login';

    const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    });

    if (!response.ok) {
        throw new Error('Erro ao fazer login');
    }

    const data = await response.json();
    console.log('Token:', data.token);
    return data.token;
}

// Executa o cliente
(async () => {
    const token = await getToken();
    console.log('Token obtido:', token);

    const socket = io("http://localhost:3000", {
        auth: { token }
    });

    socket.on("connect", () => {
        console.log("✅ Conectado como cliente de teste");

        // Envia apenas uma mensagem
        setTimeout(() => {
            socket.emit("send_message", {
                message: "Olá do terminal!"
            });
        }, 1000); // Aguarda 1 segundo antes de enviar a mensagem

        // Simula digitando uma vez
        setTimeout(() => {
            socket.emit("typing");
        }, 2000); // Aguarda 2 segundos antes de emitir "typing"
    });

    socket.on("receive_message", (msg) => {
        console.log("📨 Mensagem recebida:", msg);
    });

    socket.on("user_typing", (data) => {
        console.log(`✏️ ${data.name} está digitando...`);
    });

    socket.on("message_sent", (msg) => {
        console.log("✅ Mensagem enviada:", msg);
    });

    socket.on("message_read_ack", (data) => {
        console.log("👁 Mensagem lida:", data);
    });

    socket.on("connect_error", (err) => {
        console.error("Erro de conexão:", err.message);
    });

    socket.on("disconnect", () => {
        console.log("❌ Desconectado do servidor");
    });
})();