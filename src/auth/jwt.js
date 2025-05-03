const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (user) => {
    return jwt.sign(
        {id: user.id, nome: user.nome, email: user.email, funcao: user.funcao},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN}
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

const decodeToken = (token) => {
    return jwt.decode(token);
}

const isTokenExpired = (token) => {
    const decoded = decodeToken(token);
    if (!decoded) return true; // Se não puder decodificar, consideramos que está expirado
    const currentTime = Math.floor(Date.now() / 1000); // Tempo atual em segundos
    return decoded.exp < currentTime;
}

module.exports = {generateToken, verifyToken, decodeToken, isTokenExpired};