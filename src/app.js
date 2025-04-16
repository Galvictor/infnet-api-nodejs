const express = require('express');

const app = express();

// Rota padrão
app.get('/', (req, res) => {
    res.send('API funcionando!');
});

module.exports = app;