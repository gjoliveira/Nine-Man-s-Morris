
const { corsHeaders } = require('../utils/corsHeaders');
const { getPlayers, savePlayers } = require('../utils/dataHandler');
const crypto = require('crypto');

const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }));
    res.end(JSON.stringify(data));
};



// Função para ler corpo da requisição
const parseBody = (req, callback) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        try {
            callback(null, JSON.parse(body));
        } catch (error) {
            callback(error);
        }
    });
};

exports.register = (req, res) => {
    parseBody(req, (err, body) => {
        if (err) {
            return sendResponse(res, 400, { error: 'Erro ao processar o corpo da requisição.' });
        }

        const { nick, password } = body;

        // Validação dos argumentos
        if (!nick || !password) {
            return sendResponse(res, 400, { error: 'Nick e password são obrigatórios.' });
        }

        // Leitura dos jogadores
        const players = getPlayers();

        // Cifrar a password
        const hashPass = crypto.createHash('md5').update(password).digest('hex');

        if (players[nick]) {
            // Jogador existente -> Login
            if (players[nick].password !== hashPass) {
                return sendResponse(res, 401, { error: 'Password inválida.' });
            }

            // Atualiza o estado para online
            players[nick].status = 'online';
            savePlayers(players);

            return sendResponse(res, 200, { message: 'Login bem-sucedido.', nick });
        } else {
            // Novo registo
            players[nick] = {
                password: hashPass,
                status: 'online',
            };

            savePlayers(players);

            return sendResponse(res, 200, { message: 'Registo bem-sucedido.', nick });
        }
    });
};
