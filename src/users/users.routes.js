//Definição dos endpoints da API
const express = require('express');
const router = express.Router();

const usersController = require('./users.controller');

// Rota para obter todos os usuários
router.get('/', usersController.getAllUsers);

module.exports = router;