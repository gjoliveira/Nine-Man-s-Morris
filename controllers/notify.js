
const { corsHeaders } = require('../utils/corsHeaders');
const { getGames, saveGames, getPlayers, savePlayers, updateRanking } = require('../utils/dataHandler');
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

exports.notify = (req, res) => {
    parseBody(req, (err, body) => {
        if (err) {
            return sendResponse(res, 400, { error: 'Erro ao processar o corpo da requisição.' });
        }

        const { nick, password, game, cell } = body;

        // Validação dos argumentos
        if (!nick || !password || !game || !cell) {
            return sendResponse(res, 400, { error: 'Argumentos em falta.' });
        }

        const players = getPlayers();
        const games = getGames();

        // Validação do jogador e do jogo
        if (!players[nick] || players[nick].password !== generateHash(password)) {
            return sendResponse(res, 401, { error: 'Autenticação falhada.' });
        }

        if (!games[game]) {
            return sendResponse(res, 403, { error: 'Jogo não encontrado.' });
        }

        const currentGame = games[game];
        if (!currentGame.players[nick]) {
            return sendResponse(res, 403, { error: 'Jogador não faz parte deste jogo.' });
        }

        // Verificar se é a vez do jogador
        if (currentGame.turn !== nick) {
            return sendResponse(res, 403, { error: 'Não é a vez do jogador.' });
        }

        const { square, position } = cell;

        // Fase: drop
        if (currentGame.phase === 'drop') {
            if (!isValidMove(currentGame, square, position)) {
                return sendResponse(res, 400, { error: 'Movimento inválido.' });
            }

            currentGame.board[square][position] = currentGame.players[nick];
            currentGame.pieces[nick]--;

            // Transição para a fase move
            const player1 = Object.keys(currentGame.players)[0];
            const player2 = Object.keys(currentGame.players)[1];

            if (currentGame.pieces[player1] === 0 && currentGame.pieces[player2] === 0) {
                currentGame.phase = 'move';
                currentGame.moveCount = 0;
                console.log("Transição para a fase 'move' iniciada.");
            }

            // Atualizar o turno
            currentGame.turn = getNextPlayer(currentGame, nick);
        }

        // Fase: move
        else if (currentGame.phase === 'move') {
            handleMovePhase(currentGame, nick, square, position);

            // Contar jogadas apenas se ambos tiverem 3 peças
            const counts = countPieces(currentGame.board, currentGame.players);
            const player1 = Object.keys(currentGame.players)[0];
            const player2 = Object.keys(currentGame.players)[1];

            if (counts[player1] === 3 && counts[player2] === 3) {
                currentGame.moveCount = (currentGame.moveCount || 0) + 1;

                // Empate após 10 jogadas consecutivas com 3 peças
                if (currentGame.moveCount >= 10) {
                    currentGame.winner = 'draw';
                }
            } else {
                currentGame.moveCount = 0; // Reiniciar o contador se a condição não for cumprida
            }

            // Verificar vitória
            const newCounts = countPieces(currentGame.board, currentGame.players);
            const winner = checkWinner(currentGame, newCounts);

            if (winner) {
                currentGame.winner = winner;
                handleGameEnd(currentGame, players, games, game);
            }
        }

        currentGame.cell = cell;

        saveGames(games);

        // Enviar atualização para os clientes conectados
        sendUpdateToClients(game, {
            board: currentGame.board,
            turn: currentGame.turn,
            phase: currentGame.phase,
            step: currentGame.step,
            cell: currentGame.cell,
            winner: currentGame.winner || null,
            message: `Jogador ${nick} fez uma jogada.`,
        });

        if (currentGame.winner) {
            return sendResponse(res, 200, { message: `Jogo terminou. Vencedor: ${currentGame.winner}` });
        }

        return sendResponse(res, 200, { message: 'Jogada processada com sucesso.' });
    });
};

// Função auxiliar para finalizar o jogo
function handleGameEnd(game, players, games, gameId) {
    const winner = game.winner;
    const [player1, player2] = Object.keys(game.players);

    // Atualizar o ranking
    if (winner === 'draw') {
        updateRanking(player1, game.size, false);
        updateRanking(player2, game.size, false);
        console.log("O jogo terminou empatado.");
    } else {
        const loser = player1 === winner ? player2 : player1;
        updateRanking(winner, game.size, true); // Vitória para o vencedor
        updateRanking(loser, game.size, false); // Derrota para o perdedor
        console.log(`Vitória atribuída a ${winner}.`);
    }

    // Atualizar jogadores para offline
    players[player1].status = 'offline';
    players[player2].status = 'offline';

    // Remover o jogo
    delete games[gameId];

    savePlayers(players);
    saveGames(games);

    console.log("Jogo terminado, estados e ranking atualizados.");
}


// Função auxiliar para validar movimentos
function isValidMove(game, square, position) {
    return (
        square >= 0 &&
        square < game.size &&
        position >= 0 &&
        position < 8 &&
        game.board[square][position] === 'empty'
    );
}

// Função para contar peças no tabuleiro
function countPieces(board, players) {
    const counts = {};
    Object.values(players).forEach(color => (counts[color] = 0)); // Inicializar contadores

    board.forEach(square => {
        square.forEach(cell => {
            if (cell && Object.values(players).includes(cell)) {
                counts[cell]++;
            }
        });
    });

    return counts;
}

// Função para verificar vitória
function checkWinner(game, counts) {
    const [player1, player2] = Object.keys(game.players);

    if (counts[game.players[player1]] < 3) {
        return player2; // Jogador 2 vence
    }
    if (counts[game.players[player2]] < 3) {
        return player1; // Jogador 1 vence
    }

    return null; // Nenhum vencedor
}

// Função para tratar a fase 'move'
function handleMovePhase(game, nick, square, position) {
    if (game.step === 'from') {
        // Validar se a peça pertence ao jogador
        if (game.board[square][position] !== game.players[nick]) {
            throw new Error('Seleção inválida.');
        }
        game.lastMove = { square, position };
        game.step = 'to';
    } else if (game.step === 'to') {
        // Escolher outra peça (estamos a remover a seleção da peça)
        if (game.lastMove && game.lastMove.square === square && game.lastMove.position === position) {
            game.step = 'from';
        } else {
            // Validar destino
            if (!isValidMove(game, square, position)) {
                throw new Error('Movimento inválido.');
            }
            const { square: fromSquare, position: fromPosition } = game.lastMove;
            game.board[fromSquare][fromPosition] = 'empty';
            game.board[square][position] = game.players[nick];
    
            if (checkMill(game, square, position, game.players[nick])) {
                game.step = 'take';
            } else {
                game.step = 'from';
                // Atualizar o turno
                game.turn = getNextPlayer(game, nick);
            }
        }
    } else if (game.step === 'take') {
        // Validar se a peça pertence ao adversário
        if (game.board[square][position] !== getOpponentColor(game, nick)) {
            throw new Error('Seleção inválida. Deve escolher uma peça adversária.');
        }

        // Remover a peça adversária
        game.board[square][position] = 'empty';

        // Voltar ao estado 'from'
        game.step = 'from';

        // Atualizar o turno para o próximo jogador
        game.turn = getNextPlayer(game, nick);
    }
}

// Função para verificar uma sequência (mill)
function checkMill(game, square, position, color) {
    const board = game.board;

    // Verificar mills no mesmo quadrado
    const sameSquareSequences = [
        [0, 1, 2],
        [2, 3, 4],
        [4, 5, 6],
        [6, 7, 0]
    ];

    for (const sequence of sameSquareSequences) {
        if (sequence.includes(position)) {
            if (sequence.every(pos => board[square][pos] === color)) {
                return true; // Mill encontrado no mesmo quadrado
            }
        }
    }

    // Verificar mills entre quadrados nas posições 1, 3, 5, 7
    const betweenSquarePositions = [1, 3, 5, 7];

    if (betweenSquarePositions.includes(position)) {
        let count = 0;

        for (let i = 0; i < game.size; i++) {
            if (board[i][position] === color) {
                count++;
                if (count === 3) {
                    return true; // Mill encontrado entre quadrados
                }
            } else {
                count = 0; // Reset ao contador se uma casa não pertence ao jogador
            }
        }
    }

    return false;
}

// Próximo jogador
function getNextPlayer(game, currentPlayer) {
    return Object.keys(game.players).find(player => player !== currentPlayer);
}

// Função para obter a peça do adversário
function getOpponentColor(game, nick) {
    return Object.entries(game.players).find(([player, color]) => player !== nick)[1];
}
