const messageService = require('./messages.service');

exports.fetchRoomMessages = async (req, res) => {
    const {room} = req.params;

    if (!room) return res.status(400).json({error: 'Room is required'});

    try {
        const messages = await messageService.listMessagesByRoom(room);
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Erro ao buscar mensagens'});
    }
};

exports.saveNewMessage = async (req, res) => {
    const messageData = req.body;

    if (!messageData || !messageData.from || !messageData.to || !messageData.message || !messageData.room) {
        return res.status(400).json({error: 'Dados da mensagem incompletos'});
    }

    try {
        const saved = await messageService.saveMessage({
            ...messageData,
            timestamp: new Date().toISOString(),
            id: Date.now().toString(),
        });

        res.status(201).json(saved);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Erro ao salvar a mensagem'});
    }
};
