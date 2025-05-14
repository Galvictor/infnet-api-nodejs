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
    return messages.filter(msg => msg.room === room);
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