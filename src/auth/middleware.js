const {verifyToken} = require('./jwt');
const userService = require('../users/users.service');

// Middleware base
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({message: 'Token não fornecido'});

        const decoded = verifyToken(token);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({message: 'Token inválido ou expirado'});
    }
};

// Middleware de autorização por função
const authorize = (roles = [], options = {}) => {
    return async (req, res, next) => {
        try {
            const user = await userService.getUserById(req.userId);

            // Se for self-access e skipOnSelf estiver habilitado, ignora a verificação
            if (options.skipOnSelf && req.params.id === req.userId) {
                req.user = user;
                return next();
            }

            if (!roles.includes(user.funcao)) {
                return res.status(403).json({ message: 'Acesso não autorizado' });
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Erro na verificação de autorização' });
        }
    };
};

// Middleware para self-access (aluno só acessa próprio recurso)
const selfOrAdmin = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.userId);
        const targetId = req.params.id; // ID do recurso sendo acessado

        if (user.funcao === 'admin' || user.id === targetId) {
            return next();
        }

        res.status(403).json({message: 'Você só pode acessar seus próprios dados'});
    } catch (error) {
        res.status(500).json({message: 'Erro na verificação de acesso'});
    }
};

module.exports = {authenticate, authorize, selfOrAdmin};