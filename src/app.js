const express = require('express');
const cors = require('cors');
const {rateLimit} = require('express-rate-limit');
const app = express();
const usersRoutes = require('./users/users.routes');

// Configuração do rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 100,
    message: {
        success: false,
        message: 'Muitas requisições, tente novamente mais tarde.'
    },
    statusCode: 429
});

// Aplicar o rate limiter a todas as rotas
app.use(limiter);

app.use(cors());
app.use(express.json());
app.use('/users', usersRoutes);

// Rota padrão
app.get('/', (req, res) => {
    res.send('API funcionando!');
});

module.exports = app;