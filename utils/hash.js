const crypto = require('crypto');

// Função para gerar um hash MD5
exports.generateHash = (value) => {
    return crypto.createHash('md5').update(value).digest('hex');
};
