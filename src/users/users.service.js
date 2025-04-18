const {readFile, writeFile} = require('fs/promises');
const path = require('path');
const {userSchema, validateUser} = require('./users.model');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../data/users.json');

class UserService {
    async #loadDB() {
        const data = await readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    }

    async #saveDB(data) {
        await writeFile(DB_PATH, JSON.stringify(data, null, 2));
    }

    async create(userData) {
        validateUser(userData); // Validação simples

        const db = await this.#loadDB();

        // Verifica email único
        if (db.users.some(u => u.email === userData.email)) {
            throw new Error('Email já cadastrado');
        }

        // Cria hash da senha
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const newUser = {
            ...userSchema,
            ...userData,
            password: hashedPassword,
            id: Date.now().toString(),
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        db.users.push(newUser);
        await this.#saveDB(db);

        const {password, ...safeUser} = newUser;
        return safeUser;
    }

    async findAll({funcao, page = 1, limit = 10}) {
        const db = await this.#loadDB();
        let users = db.users;

        if (funcao) {
            users = users.filter(u => u.funcao === funcao);
        }

        // Paginação
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        return {
            total: users.length,
            results: users.slice(startIndex, endIndex).map(user => {
                const {password, ...rest} = user;
                return rest;
            })
        };
    }

    async findById(id) {
        const db = await this.#loadDB();
        const user = db.users.find(u => u.id === id);

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const {password, ...rest} = user;
        return rest;
    }

    // Outros métodos: update, delete...
}

module.exports = new UserService();