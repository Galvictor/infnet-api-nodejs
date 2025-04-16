const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');

// Rota para obter todos os usuários
router.get('/', usersController.getAllUsers);

module.exports = router;