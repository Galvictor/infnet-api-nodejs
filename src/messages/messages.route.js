const express = require('express');
const router = express.Router();
const messagesController = require('./messages.controller');

router.get('/:room', messagesController.fetchRoomMessages);
router.post('/', messagesController.saveNewMessage);

module.exports = router;