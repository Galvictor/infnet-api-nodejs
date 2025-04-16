const fs = require('fs/promises');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'users.json');

const getAllUsers = async () => {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

module.exports = {
    getAllUsers
}