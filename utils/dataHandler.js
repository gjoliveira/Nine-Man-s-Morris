const fs = require('fs');
const path = require('path');

// Caminhos dos ficheiros
const files = {
    players: path.join(__dirname, '../data/players.json'),
    games: path.join(__dirname, '../data/games.json'),
    ranking: path.join(__dirname, '../data/ranking.json'),
};

// Função genérica para ler ficheiros
const readData = (file) => {
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file, 'utf8'));
};

// Função genérica para escrever em ficheiros
const writeData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Exportar funções específicas
exports.getPlayers = () => readData(files.players);
exports.savePlayers = (data) => writeData(files.players, data);

exports.getGames = () => readData(files.games);
exports.saveGames = (data) => writeData(files.games, data);

exports.getRanking = () => readData(files.ranking);
exports.saveRanking = (data) => writeData(files.ranking, data);

// Função para atualizar ranking de acordo com o tamanho do tabuleiro
exports.updateRanking = (nick, size, victory) => {
    const ranking = readData(files.ranking);

    if (!ranking[size]) ranking[size] = [];
    const playerIndex = ranking[size].findIndex(p => p.nick === nick);

    if (playerIndex !== -1) {
        ranking[size][playerIndex].games += 1;
        if (victory) ranking[size][playerIndex].victories += 1;
    } else {
        ranking[size].push({ nick, games: 1, victories: victory ? 1 : 0 });
    }

    // Ordena o ranking
    ranking[size].sort((a, b) => {
        if (b.victories === a.victories) {
            return a.nick.localeCompare(b.nick);
        }
        return b.victories - a.victories;
    });
    writeData(files.ranking, ranking);
};
