
const { corsHeaders } = require('../utils/corsHeaders');
const { getGames, saveGames, getPlayers, savePlayers, updateRanking } = require('../utils/dataHandler');
const url = require('url');

// Lista global para conexões SSE
const sseConnections = [];

const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }));
    res.end(JSON.stringify(data));
};

// Função para ler corpo da requisição
//
const parseSSEBody = (req, callback) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString(); // Ensure chunk is treated as a string
    });

    req.on('end', () => {
        try {
            // Split body by lines and parse SSE format
            const events = body
                .trim()
                .split('\n\n') // Separate messages
                .map(eventBlock => {
                    const event = {};
                    eventBlock.split('\n').forEach(line => {
                        const [key, value] = line.split(/:(.*)/); // Split at the first colon
                        if (key && value !== undefined) {
                            event[key.trim()] = value.trim();
                        }
                    });
                    return event;
                });

            callback(null, events);
        } catch (error) {
            callback(error);
        }
    });
};
/*
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
*/

// Controlador principal
exports.update = (req, res) => {
    const query = url.parse(req.url, true).query;
    const { nick, game } = query;

    if (!nick || !game) {
        return sendResponse(res, 400, { error: 'Argumentos em falta.' });
    }

    parseSSEBody(req, (err, body) => {
        if (err) {
	    console.log(err);
            return sendResponse(res, 400, { error: 'Erro ao processar o corpo da requisição.' });
        }

        // Se for necessário acessar algum dado do corpo:
        console.log('Corpo da requisição:', body);

        const games = getGames();
        const players = getPlayers();

        // Continuação da lógica original
        if (!games[game]) {
            return sendResponse(res, 403, { error: 'Jogo não encontrado.' });
        }

        const currentGame = games[game];

        if (!currentGame.players || !currentGame.players[nick]) {
            return sendResponse(res, 403, { error: 'Jogador não faz parte deste jogo.' });
        }

console.log("JERE");

        // Lógica SSE
        if (req.headers.accept && req.headers.accept === 'text/event-stream') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
	    res.setHeader('Access-Control-Allow-Origin', '*');

            sseConnections.push({ nick, game, res });

            const message = `data: ${JSON.stringify({ message: 'Conexão SSE estabelecida.' })}\n\n`;
            res.write(message);

		    /*
            req.on('close', () => {
                const index = sseConnections.findIndex(conn => conn.res === res);
                if (index !== -1) {
			console.log("Closing: ", index);
                    sseConnections.splice(index, 1);
                }
            });
	    */

	console.log("ENTREIIII");
		    return;
        }

        // Estado do jogo
        const response = {
            board: currentGame.board || [],
            cell: currentGame.cell || null,
            phase: currentGame.phase || 'drop',
            step: currentGame.step || 'from',
            players: currentGame.players,
            turn: currentGame.turn,
            winner: currentGame.winner,
        };

console.log("JERE2");
        // Atualizar clientes conectados via SSE
        sendUpdateToClients(game, {
            board: currentGame.board,
            turn: currentGame.turn,
            phase: currentGame.phase,
            step: currentGame.step,
            winner: currentGame.winner || null,
            message: `Atualização do jogo solicitada pelo jogador ${nick}.`,
        });
console.log("JERE3");

        return sendResponse(res, 200, response);
    });
};

// Função para enviar atualizações SSE
function sendUpdateToClients(clientGame, updateData) {
    sseConnections.forEach(({ game: serverGame, res }) => {
        if (clientGame === serverGame) {
            // Create SSE formatted message
            const message = `data: ${JSON.stringify(updateData)}\n\n`;

            // Write message to the response
            res.write(message);

            console.log(`Sent to client (${clientGame}):`, updateData);
        }
    });
}

exports.sendUpdateToClients = sendUpdateToClients;
