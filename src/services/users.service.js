//services/	Onde mora a lógica de negócio real, como validações, filtros, cálculos etc.

const usersModel = require('../models/users.model');

const getAllUsers = async () => {
    const users = await usersModel.getAllUsers();
    if (!users || users.length === 0) {
        throw new Error('Usuários não encontrados');
    }
    return users;
};

module.exports = {
    getAllUsers
};