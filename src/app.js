const express = require('express');
const app = express();
const usersRoutes = require('./users/users.routes');

app.use(express.json());
app.use('/users', usersRoutes);

// Rota padrão
app.get('/', (req, res) => {
    res.send('API funcionando!');
});

module.exports = app;