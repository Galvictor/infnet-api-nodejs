const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const {authenticate, authorize, selfOrAdmin} = require('../auth/middleware');

// Rota pública
router.post('/login', usersController.login);

// Todas as rotas abaixo exigem autenticação
router.use(authenticate);

// Rotas com autorização específica
router.get('/',
    authorize(['admin', 'professor']), // Apenas admin e professor podem listar todos
    usersController.getAllUsers
);

router.post('/',
    authorize(['admin']), // Apenas admin pode criar
    usersController.createUser
);

router.get('/me/:id',
    selfOrAdmin, // Aluno só acessa seu próprio perfil
    usersController.findUserById
);

router.get('/me',
    selfOrAdmin,
    usersController.getProfile
)

router.put('/:id',
    selfOrAdmin, // Aluno só edita seu próprio perfil
    authorize(['admin'], {skipOnSelf: true}), // Admin edita qualquer um
    usersController.updateUser
);

router.delete('/:id',
    authorize(['admin']), // Apenas admin pode deletar
    usersController.deleteUser
);

module.exports = router;