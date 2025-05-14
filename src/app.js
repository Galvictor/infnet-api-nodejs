const express = require('express');
const cors = require('cors');
const {rateLimit} = require('express-rate-limit');
const app = express();
const usersRoutes = require('./users/users.route');
const messagesRoute = require("./messages/messages.route");
require('dotenv').config();

// Configuração do rate limiter
const limiter = rateLimit({
    windowMs: process.env.REQUEST_LIMIT_MINUTES,
    limit: process.env.REQUEST_LIMIT_MAX,
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
app.use('/messages', messagesRoute)

// Rota padrão
app.get('/', (req, res) => {
    res.send('API funcionando!');
});

module.exports = app;