const {io} = require("socket.io-client");

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
    return data.token;
}

// Executa o cliente
(async () => {
    const token = await getToken();

    const socket = io("http://localhost:3000", {
        auth: {token}
    });

    socket.on("connect", () => {
        console.log("✅ Carlos conectado como cliente de teste");

        // Entra em uma sala privada para conversar com Ana
        const to = 'ana.silva@email.com';
        socket.emit("join_private_room", {to});

        // Aguarda 2 segundos e digita para Ana
        setTimeout(() => {
            socket.emit("typing", {to});
        }, 2000);

        // Responde para Ana
        setTimeout(() => {
            socket.emit("send_private_message", {
                to,
                message: "Olá Ana! Estou bem e você?"
            });
        }, 4000);
    });

    socket.on("receive_private_message", (msg) => {
        console.log("📨 Mensagem privada recebida:", msg);
    });

    socket.on("message_status_updated", ({id, status}) => {
        console.log(`🔄 Status atualizado da mensagem ${id}: ${status}`);
    });

    socket.on("user_typing", (data) => {
        console.log(`✏️ ${data.name} está digitando...`);
    });

    socket.on("disconnect", () => {
        console.log("❌ Carlos desconectado do servidor");
    });
})();