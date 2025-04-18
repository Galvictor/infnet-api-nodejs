// Schema do usuário
const userSchema = {
    id: {type: String, required: true},
    nome: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    confirmPassword: {type: String, required: true},
    funcao: {
        type: String,
        enum: ['admin', 'aluno', 'professor'],
        default: 'aluno'
    }
};

// Função de validação
function validateUser(user) {
    const requiredFields = ['nome', 'email', 'password', 'funcao'];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Verifica campos obrigatórios
    for (const field of requiredFields) {
        if (!user[field]) {
            throw new Error(`Campo ${field} é obrigatório`);
        }
    }

    // Validações adicionais
    if (user.password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    // Verifica se a senha e a confirmação de senha são iguais
    if (user.password !== user.confirmPassword) {
        throw new Error('Senha e confirmação de senha não coincidem');
    }

    // Valida email
    if (!emailRegex.test(user.email)) {
        throw new Error('Email inválido');
    }

    // Valida função
    if (!userSchema.funcao.enum.includes(user.funcao)) {
        throw new Error(`Função deve ser uma das: ${userSchema.funcao.enum.join(', ')}`);
    }
}

module.exports = {userSchema, validateUser};