const {readFile, writeFile} = require('fs/promises');
const path = require('path');
const {userSchema, validateCreateUser, validateUpdateUser} = require('./users.model');
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
        validateCreateUser(userData); // Validação simples

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
            confirmPassword: undefined, // Remove o campo de confirmação de senha
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

    async getUserById(id) {
        const db = await this.#loadDB();
        const user = db.users.find(u => u.id === id);

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const {password, ...rest} = user;
        return rest;
    }

    async #findUserWithPassword(email) {
        const db = await this.#loadDB();
        return db.users.find(user => user.email === email) || null;
    }

    async findByEmail(email) {
        const user = await this.#findUserWithPassword(email);
        if (!user) return null;

        // Remove a senha do retorno
        const {password, ...userWithoutPassword} = user;
        return userWithoutPassword;
    }

    async update(id, userData) {
        const db = await this.#loadDB();
        const userIndex = db.users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            throw new Error('Usuário não encontrado');
        }

        // Validação simples
        validateUpdateUser(userData);

        // Atualiza o usuário
        const updatedUser = {
            ...db.users[userIndex],
            ...userData,
            password: userData.password
                ? await bcrypt.hash(userData.password, 10)
                : db.users[userIndex].password,
            confirmPassword: undefined, // Remove o campo de confirmação de senha
            atualizadoEm: new Date().toISOString() // Sempre atualiza
        };

        db.users[userIndex] = updatedUser;
        await this.#saveDB(db);

        const {password, confirmPassword, ...safeUser} = updatedUser;
        return safeUser;
    }

    async delete(id) {
        const db = await this.#loadDB();
        const userIndex = db.users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            throw new Error('Usuário não encontrado');
        }

        db.users.splice(userIndex, 1);
        await this.#saveDB(db);
    }

    async verifyPassword(email, plainPassword) {
        const user = await this.#findUserWithPassword(email); // Usa o método privado
        if (!user) return false;

        return bcrypt.compare(plainPassword, user.password);
    }

}

module.exports = new UserService();