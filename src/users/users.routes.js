//Definição dos endpoints da API
const express = require('express');
const router = express.Router();

const usersController = require('./users.controller');

// Rota para obter todos os usuários
router.get('/', usersController.getAllUsers);
router.post('/', usersController.createUser);
router.get('/:id', usersController.findUserById);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;