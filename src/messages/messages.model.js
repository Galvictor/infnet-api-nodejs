const fs = require('fs/promises');
const path = require('path');
const messagesPath = path.join(__dirname, '../data/messages.json');

async function readMessagesFile() {
    try {
        const data = await fs.readFile(messagesPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return []; // se o arquivo estiver vazio ou não existir
    }
}

async function writeMessagesFile(messages) {
    await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));
}

async function getAllMessages() {
    return await readMessagesFile();
}

async function getMessagesByRoom(room) {
    const messages = await readMessagesFile();

    /*
    room pode vir desse jeito da ana ana.silva@email.com-carlos.oliveira@email.com
    mas esta vindo do carlos asssim: carlos.oliveira@email.com-ana.silva@email.com
    então vamos fazer uma gambiarra para arruma isso e poder verificar os 2 casos
    */

    // Quebra o room em duas partes, separadas pelo '-'
    const [email1, email2] = room.split('-');
    const normalizedRoom = [email1, email2].sort().join('-'); // Ordena os e-mails para padronizar

    return messages.filter(msg => {
        // Padroniza o room de cada mensagem antes de comparar
        const [msgEmail1, msgEmail2] = msg.room.split('-');
        const normalizedMsgRoom = [msgEmail1, msgEmail2].sort().join('-');
        return normalizedMsgRoom === normalizedRoom;
    });
}

async function addMessage(message) {
    const messages = await readMessagesFile();
    messages.push(message);
    await writeMessagesFile(messages);
    return message;
}

module.exports = {
    getAllMessages,
    getMessagesByRoom,
    addMessage,
};