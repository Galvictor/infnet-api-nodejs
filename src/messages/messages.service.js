const messagesModel = require('./messages.model');

async function listMessagesByRoom(room) {
    return await messagesModel.getMessagesByRoom(room);
}

async function saveMessage(messageData) {
    return await messagesModel.addMessage(messageData);
}

module.exports = {
    listMessagesByRoom,
    saveMessage,
};
