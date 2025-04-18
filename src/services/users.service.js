const { readFile, writeFile } = require('fs/promises');
const path = require('path');
const { userSchema, validateUser } = require('../models/users.model');

const DB_PATH = path.join(__dirname, '../data/users.json');

class UserService {
    async #loadDB() {
        const data = await readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    }

    async #saveDB(data) {
        await writeFile(DB_PATH, JSON.stringify(data, null, 2));
    }

    async findAll({ funcao, page = 1, limit = 10 }) {
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
                const { password, ...rest } = user;
                return rest;
            })
        };
    }

    // Outros métodos: find, update, delete...
}

module.exports = new UserService();