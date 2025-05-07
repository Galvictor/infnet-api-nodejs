const userService = require('./users.service');
const {generateToken, verifyToken, decodeToken} = require('../auth/jwt');

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }

        const isValid = await userService.verifyPassword(email, password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const user = await userService.findByEmail(email);
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                funcao: user.funcao
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro durante o login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        // Só chega aqui se for admin/professor (middleware já validou)
        const {page = 1, limit = 10, funcao} = req.query;
        const result = await userService.findAll({
            page: parseInt(page),
            limit: parseInt(limit),
            funcao
        });

        res.status(200).json({
            success: true,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(result.total / limit),
                totalItems: result.total
            },
            data: result.results
        });

    } catch (error) {
        console.error('Erro no getAllUsers:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuários',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getChatListUsersButNotMe = async (req, res) => {
    try {
        // Middleware selfOrAdmin já validou o acesso
        const {page = 1, limit = 10, funcao} = req.query;
        const result = await userService.getAllUsersButNotMe({
            id: req.userId,
            page: parseInt(page),
            limit: parseInt(limit),
            funcao
        });

        res.status(200).json({
            success: true,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(result.total / limit),
                totalItems: result.total
            },
            data: result.results
        });

    } catch (error) {
        console.error('Erro no getChatListUsersButNotMe:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuários',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

exports.createUser = async (req, res) => {
    try {
        // Só chega aqui se for admin (middleware já validou)
        const newUser = await userService.create(req.body);
        res.status(201).json({
            success: true,
            data: newUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.findUserById = async (req, res) => {
    try {
        // Middleware selfOrAdmin já validou o acesso
        const user = await userService.getUserById(req.params.id);

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Usuário não encontrado',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // Middleware selfOrAdmin já validou o acesso
        const user = await userService.getUserById(req.userId);

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Usuário não encontrado',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        // Bloqueia alteração de função se não for admin
        if (req.user.funcao !== 'admin' && req.body.funcao) {
            return res.status(403).json({
                success: false,
                message: 'Apenas administradores podem alterar funções'
            });
        }

        const updatedUser = await userService.update(req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: updatedUser
        });

    } catch (error) {
        const statusCode = error.message.includes('não encontrado') ? 404 : 400;
        res.status(statusCode).json({
            success: false,
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.updateOwnAccount = async (req, res) => {
    try {
        // Middleware selfOrAdmin já validou o acesso

        const updatedUser = await userService.update(req.userId, req.body);
        res.status(200).json({
            success: true,
            data: updatedUser
        });

    } catch (error) {
        const statusCode = error.message.includes('não encontrado') ? 404 : 400;
        res.status(statusCode).json({
            success: false,
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        // Só chega aqui se for admin (middleware já validou)
        await userService.delete(req.params.id);
        res.status(204).end();

    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.deleteOwnAccount = async (req, res) => {
    try {
        // Middleware selfOrAdmin já validou o acesso
        await userService.delete(req.userId);
        res.status(204).end();

    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}