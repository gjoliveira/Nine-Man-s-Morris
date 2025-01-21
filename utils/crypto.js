const crypto = require('crypto');

exports.generateGameId = (data) => {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
};
