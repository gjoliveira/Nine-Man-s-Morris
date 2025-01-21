
const { corsHeaders } = require('../utils/corsHeaders');
const { getPlayers, savePlayers, getGames, saveGames, updateRanking } = require('../utils/dataHandler');
const { generateHash } = require('../utils/hash');
const { sendUpdateToClients } = require('./update');
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

exports.leave = (req, res) => {
    parseBody(req, (err, body) => {
        if (err) {
            return sendResponse(res, 400, { error: 'Erro ao processar o corpo da requisição.' });
        }

        const { nick, password, game } = body;

        // Validação dos argumentos
        if (!nick || !password || !game) {
            return sendResponse(res, 400, { error: 'Argumentos em falta.' });
        }

        // Leitura dos jogadores e validação de autenticação
        const players = getPlayers();
        if (!players[nick] || players[nick].password !== generateHash(password)) {
            return sendResponse(res, 401, { error: 'Autenticação falhada.' });
        }

        const games = getGames();

        // Verifica se o jogo existe
        if (!games[game]) {
            return sendResponse(res, 403, { error: 'Jogo inválido.' });
        }

        const currentGame = games[game];

        // Verifica se o jogador está no jogo
        if (!currentGame.players[nick]) {
            return sendResponse(res, 403, { error: 'Jogador não faz parte deste jogo.' });
        }

        // Caso 1: Jogador está em espera (sala de espera)
        if (Object.keys(currentGame.players).length === 1) {
            // Remove o jogo da lista de espera
            delete games[game];
            players[nick].status = 'offline';

            saveGames(games);
            savePlayers(players);

            return sendResponse(res, 200, { message: 'Jogador removido da sala de espera.' });
        }

        // Caso 2: Jogador está num jogo em curso
        if (Object.keys(currentGame.players).length === 2) {
            // Determina o adversário
            const opponentNick = Object.keys(currentGame.players).find(player => player !== nick);

            // Atualiza o ranking: adversário ganha, jogador perde
            updateRanking(opponentNick, currentGame.size, true); // Vitória para o adversário
            updateRanking(nick, currentGame.size, false);        // Derrota para o jogador

            // Enviar atualização SSE para os clientes conectados
            sendUpdateToClients(game, {
                board: currentGame.board,
                turn: null,
                phase: currentGame.phase,
                winner: opponentNick,
                message: `Jogador ${nick} abandonou o jogo. ${opponentNick} venceu!`,
            });

            // Remove o jogo e atualiza os estados dos jogadores
            delete games[game];
            players[nick].status = 'offline';
            players[opponentNick].status = 'offline';

            saveGames(games);
            savePlayers(players);

            return sendResponse(res, 200, { message: 'Jogador desistiu do jogo. O adversário venceu.' });
        }

        return sendResponse(res, 403, { error: 'Ação não permitida.' });
    });
};
