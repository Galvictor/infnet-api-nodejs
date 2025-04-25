//Definição dos endpoints da API
const express = require('express');
const router = express.Router();

const usersController = require('./users.controller');
const {authenticate} = require('../auth/middleware');

// Rota para obter todos os usuários
router.get('/', authenticate, usersController.getAllUsers);
router.post('/', usersController.createUser);
router.get('/:id', usersController.findUserById);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);
router.post('/login', usersController.login);

module.exports = router;