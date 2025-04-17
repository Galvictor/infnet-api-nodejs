//Tratamento de requisições/respostas HTTP
const usersService = require('../services/users.service');

const getAllUsers = async (req, res) => {
    try {
        const users = await usersService.getAllUsers();
        res.status(200).json(users);

    } catch (error) {
        console.error(error);
        if (error.message === 'Usuários não encontrados') {
            return res.status(404).json({message: error.message});
        }
        res.status(500).json({message: 'Internal Server Error'});
    }
}

module.exports = {
    getAllUsers
}