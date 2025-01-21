
const { corsHeaders } = require('../utils/corsHeaders');
const { getRanking } = require('../utils/dataHandler');
const url = require('url');

// Função para enviar resposta JSON
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

exports.ranking = (req, res) => {
    parseBody(req, (err, body) => {
        if (err) {
            return sendResponse(res, 400, { error: 'Erro ao processar o corpo da requisição.' });
        }

        const { group, size } = body;

        if (!group || !size) {
            return sendResponse(res, 400, { error: 'Argumentos em falta.' });
        }

        if (group != 12) {
            return sendResponse(res, 400, { error: 'Group inválido. Deve ser 12.' });
        }

        const rankingData = getRanking();

        // Verifica se existe ranking para o size pedido
        const sizeRanking = rankingData[size] || [];

        // Ordenar por vitórias e depois alfabeticamente por nick
        const topPlayers = sizeRanking
            .sort((a, b) => {
                if (b.victories === a.victories) {
                    return a.nick.localeCompare(b.nick);
                }
                return b.victories - a.victories;
            })
            .slice(0, 10);

        sendResponse(res, 200, { ranking: topPlayers });
    });
};
