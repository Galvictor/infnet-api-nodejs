const userService = require('./users.service');

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