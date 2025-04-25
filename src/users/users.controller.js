const userService = require('./users.service');
const {generateToken} = require('../auth/jwt');

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;

        // 1. Validação básica
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }

        // 2. Busca usuário
        const user = await userService.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        // 3. Verifica senha (precisa carregar o usuário completo)
        const dbUser = await userService.verifyPassword(email, password);
        if (!dbUser) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        // 4. Gera token
        const token = generateToken(user.id);

        // 5. Retorna resposta
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
        const {page = 1, limit = 10, funcao} = req.query;
        const result = await userService.findAll({page, limit, funcao});

        if (result.results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nenhum usuário encontrado com os critérios especificados'
            });
        }

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
            message: 'Erro interno no servidor',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        const newUser = await userService.create(req.body);
        res.status(201).json({
            success: true,
            data: newUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

exports.findUserById = async (req, res) => {
    try {
        const user = await userService.findById(req.params.id);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
}

exports.updateUser = async (req, res) => {
    try {
        // Se estiver atualizando a senha, requer confirmação
        if (req.body.password && !req.body.confirmPassword) {
            throw new Error('Confirmação de senha é obrigatória');
        }

        const updatedUser = await userService.update(req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await userService.delete(req.params.id);
        res.status(204).json({
            success: true,
            message: 'Usuário deletado com sucesso'
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};