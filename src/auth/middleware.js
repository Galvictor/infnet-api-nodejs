const {verifyToken} = require('./jwt');

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({message: 'Token não fornecido'});
        }

        const decoded = verifyToken(token);
        req.userId = decoded.id;
        next();

    } catch (error) {
        res.status(401).json({message: 'Token inválido ou expirado'});
    }
};

module.exports = {authenticate};