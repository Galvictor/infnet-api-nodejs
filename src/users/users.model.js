// Schema do usuário
const userSchema = {
    id: {type: String, required: true},
    nome: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    funcao: {
        type: String,
        enum: ['admin', 'aluno', 'professor'],
        default: 'aluno'
    }
};

// Função de validação
function validateUser(user) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
        throw new Error('Email inválido');
    }
}

module.exports = {userSchema, validateUser};