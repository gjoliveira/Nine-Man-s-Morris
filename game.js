let jogoAtual = null;
let URL_GLOBAL = ""; 


// Ao carregar a página
window.onload = function() {
    document.getElementById('instrucoes-img').style.display = 'none';
};



// ----------------------------------------------------------------------------------
// ----------------------------INSTRUÇÕES--------------------------------------------
// ----------------------------------------------------------------------------------


// Lógica para mostrar instruções
document.getElementById('show-instructions').addEventListener('click', function() {
    closeSettingsPopup();
    document.getElementById('instrucoes-container').style.display = 'flex';
    document.querySelector('.overlay').style.display = 'block';
    document.getElementById('instrucoes-img').style.display = 'block';
});


// Fechar instruções ao clicar no overlay
document.querySelector('.overlay').addEventListener('click', function() {
    document.getElementById('instrucoes-container').style.display = 'none';
    this.style.display = 'none';
    document.getElementById('instrucoes-img').style.display = 'none';
});


// ----------------------------------------------------------------------------------
// -----------------------------------REINICIAR--------------------------------------
// ----------------------------------------------------------------------------------


// Evento para o ícone de reinício do jogo no quadro de comandos
document.getElementById('restart-game').addEventListener('click', function() {
    // Reinicia o jogo com as configurações atuais
    restartGame(config);
});

document.addEventListener('DOMContentLoaded', () => {
    const restartGameButton = document.getElementById('restart-game');

    function toggleRestartButton(mode) {
        if (mode === 'online') {
            restartGameButton.style.display = 'none';
        } else if (mode === 'offline') {
            restartGameButton.style.display = 'block';
        }
    }

    // Update button visibility based on mode selection
    const playOfflineButton = document.getElementById('play-offline');
    const playOnlineButton = document.getElementById('play-online');

    playOfflineButton.addEventListener('click', () => {
        toggleRestartButton('offline');
    });

    playOnlineButton.addEventListener('click', () => {
        toggleRestartButton('online');
    });
});



// Função de reiniciar o jogo (também permite começar o jogo)
function restartGame(config) {
    // Finaliza o jogo anterior, se existir
    if (jogoAtual !== null) {
        jogoAtual.matarJogo();
    }
    config.carregarConfiguracoes();
    jogoAtual = config.aplicarConfiguracoes();

    // Atualiza o jogador inicial com base nas configurações
    atualizarMensagemInterface(config.firstPlayer, 1);
}


// ----------------------------------------------------------------------------------
// ---------------------------------MENSAGENS----------------------------------------
// ----------------------------------------------------------------------------------


function atualizarMensagemInterface(jogador, fase) {
    const message = document.getElementById('mensagem_atual');
    const isServerMode = sessionStorage.getItem("gameId") !== null;

    // Fetch nicknames from sessionStorage
    const nick = sessionStorage.getItem('nick') || 'Jogador 1';
    const opponentNick = sessionStorage.getItem('opponentNick') || 'Jogador 2';

    let player;

    if (isServerMode) {
        // Assign player nickname dynamically
        player = jogador === 'player1' ? nick : opponentNick;
    } else {
        player = jogador === 'player1' ? 'Jogador 1' : 'Jogador 2';
    }

    // Set the message based on the phase
    if (fase === 1) {
        message.innerHTML = `É a vez do jogador <b>${player}</b> de <b>colocar</b> uma peça.`;
    } else if (fase === 2) {
        message.innerHTML = `É a vez do jogador <b>${player}</b> de <b>mover</b> uma peça.`;
    } else if (fase === 3) {
        message.innerHTML = `Foi feito um moinho. O <b>${player}</b> deve capturar uma peça do adversário.`;
    }
}



// ----------------------------------------------------------------------------------
// -------------------------MOSTRAR AS PEÇAS NA LATERAL------------------------------
// ----------------------------------------------------------------------------------


document.addEventListener('DOMContentLoaded', () => {
    const gameBoardHeight = document.getElementById('game-board').offsetHeight;
    document.getElementById('pecas-jogador1').style.maxHeight = `${gameBoardHeight}px`;
    document.getElementById('pecas-jogador2').style.maxHeight = `${gameBoardHeight}px`;
    document.getElementById('capturadas-jogador1').style.maxHeight = `${gameBoardHeight}px`;
    document.getElementById('capturadas-jogador2').style.maxHeight = `${gameBoardHeight}px`;
});

// ----------------------------------------------------------------------------------
// ---------------------------CLASSIFICAÇÕES-----------------------------------------
// ----------------------------------------------------------------------------------


const showRankingBtn = document.getElementById("show-rankings");
const closeRankingBtn = document.getElementById("close-ranking-btn");
const rankingPanel = document.getElementById("ranking-panel");
const rankingBody = document.getElementById("ranking-body");



// Fechar painel de classificações
closeRankingBtn.addEventListener("click", () => {
    rankingPanel.classList.add("hidden");
    rankingPanel.style.display = "none"; // Oculta o painel
});

// ----------------------------------------------------------------------------------
// -------------------------------------- JOGO --------------------------------------
// ----------------------------------------------------------------------------------

class ConfiguracaoJogo {
    constructor() {
        this.boardSize = 3;
        this.gameMode = 'pvp';
        this.aiDifficulty = 'medium';
        this.firstPlayer = 'player1';
    }

    resetConfiguracoes() {
        this.boardSize = 3;
        this.gameMode = 'pvp';
        this.aiDifficulty = 'medium';
        this.firstPlayer = 'player1';
    }

    getSize() {
        return this.boardSize;
    }

    carregarConfiguracoes() {
        this.boardSize = parseInt(document.getElementById('board-size').value);
        this.gameMode = document.querySelector('input[name="game-mode"]:checked').value;
        this.aiDifficulty = document.getElementById('ai-difficulty').value;
        this.firstPlayer = document.getElementById('first-player').value;
    }

    aplicarConfiguracoes() {
        if (this.firstPlayer === 'random') {
            this.firstPlayer = Math.random() < 0.5 ? 'player1' : 'player2';
        }
        return new Jogo(this.boardSize, this.firstPlayer, this.gameMode, this.aiDifficulty, true);
    }
}

// Esta classe representa os nós, ou seja onde podem ser ou não jogadas peças
class No {
    constructor(id, x, y) {
        this.id = id;   // Identificador do nó ('Id do quadrado' + 'Id da Peça')
        this.state = null; // Se null, casa está vazia, caso contrário, pertence a player1 ou player2
        this.x = x; // Coordenada X do nó
        this.y = y; // Coordenada Y do nó
        this.conexoes = []; // Lista de nós conectados
        this.moinho = false;    // Indica se o nó faz parte de um moinho
    }
}

// Estrutura do tabuleiro 
class Tabuleiro {
    constructor(numNiveis, jogo, show) {
        this.niveis = []    // Lista com as listas dos nós por niveis
        this.numNiveis = numNiveis;     // Número de quadrados (niveis)
        this.nos = []; // Armazena todos os nós, independentemente do nivel
        this.tamanhoTabuleiro = 500; // Tamanho total do tabuleiro 
        this.centroTabuleiro = this.tamanhoTabuleiro / 2; // Coordenada do centro do tabuleiro
        this.jogo = jogo;
        if (show) {
            this.rend = new Renderizador(this);
        }
        this.moinhosAtivos = jogo.moinhosAtivos; // Referência direta ao estado dos moinhos ativos
        this.criarTabuleiro();
        this.conectarNos();
    }

    // Esta função crias os nós 
    criarTabuleiro() {
        const maxTamanhoQuadrado = this.tamanhoTabuleiro / 2; // O tamanho máximo para o quadrado externo
        const step = maxTamanhoQuadrado / (this.numNiveis); // Diferença de tamanho entre quadrados

        // Criar nós para cada nível
        for (let i = 0; i < this.numNiveis; i++) {
            const nivel = [];
            const baseId = `${this.numNiveis - i}`; // ID do nível atual (começa no quadrado exterior e vai andando para o centro)
            const tamanhoQuadrado = maxTamanhoQuadrado - (i * step); // Tamanho do quadrado atual

            // Definindo posições dos nós em forma de quadrado (centralizado)
            const positions = this.gerarPosicoes(tamanhoQuadrado)

            // Adicionando os nós ao nível
            positions.forEach((pos, index) => {
                const no = new No(
                    `${baseId}${index + 1}`,
                    this.centroTabuleiro + pos.x, // Posição x ajustada ao centro
                    this.centroTabuleiro + pos.y  // Posição y ajustada ao centro
                );
                nivel.push(no);
                this.nos.push(no);
            });
            this.niveis.push(nivel)
        }
    }

    gerarPosicoes(tamanhoQuadrado) {
        return [
            { x: -tamanhoQuadrado, y: -tamanhoQuadrado }, // Superior Esquerdo
            { x: 0, y: -tamanhoQuadrado },               // Superior Centro
            { x: tamanhoQuadrado, y: -tamanhoQuadrado },  // Superior Direito
            { x: -tamanhoQuadrado, y: 0 },               // Esquerda Centro
            { x: tamanhoQuadrado, y: 0 },                // Direita Centro
            { x: -tamanhoQuadrado, y: tamanhoQuadrado }, // Inferior Esquerdo
            { x: 0, y: tamanhoQuadrado },                // Inferior Centro
            { x: tamanhoQuadrado, y: tamanhoQuadrado },   // Inferior Direito
        ];
    }

    conectarNos() {
        // Conectar nós dentro de cada nível
        for (let nivel of this.niveis) {
            nivel[0].conexoes.push(nivel[1], nivel[3]);
            nivel[1].conexoes.push(nivel[0], nivel[2]);
            nivel[2].conexoes.push(nivel[1], nivel[4]);
            nivel[3].conexoes.push(nivel[0], nivel[5]);
            nivel[4].conexoes.push(nivel[2], nivel[7]);
            nivel[5].conexoes.push(nivel[3], nivel[6]);
            nivel[6].conexoes.push(nivel[5], nivel[7]);
            nivel[7].conexoes.push(nivel[4], nivel[6]);
        }

        for (let i = 1; i < this.numNiveis; i++) {
            this.niveis[i][1].conexoes.push(this.niveis[i - 1][1]); // Liga os nós 2
            this.niveis[i][3].conexoes.push(this.niveis[i - 1][3]); // Liga os nós 4
            this.niveis[i][4].conexoes.push(this.niveis[i - 1][4]); // Liga os nós 5
            this.niveis[i][6].conexoes.push(this.niveis[i - 1][6]); // Liga os nós 7

            this.niveis[i - 1][1].conexoes.push(this.niveis[i][1]); 
            this.niveis[i - 1][3].conexoes.push(this.niveis[i][3]);
            this.niveis[i - 1][4].conexoes.push(this.niveis[i][4]);
            this.niveis[i - 1][6].conexoes.push(this.niveis[i][6]);
        }
    }

        // Obtém o nó com um id específico
    getNodeById(id) {
        console.log('A procurar um No com id: ', id);
        return this.nos.find(no => no.id == id);
    }

}

class Renderizador {
    constructor(tabuleiro) {
        this.tabuleiro = tabuleiro;
        this.gameBoard = document.getElementById('game-board');
        this.pecasJogador1Container = document.getElementById('pecas-jogador1');
        this.pecasJogador2Container = document.getElementById('pecas-jogador2');
        this.pecasCapturadas1 = document.getElementById('capturadas-jogador1');
        this.pecasCapturadas2 = document.getElementById('capturadas-jogador2');
    }

    // Renderiza todo o tabuleiro
    renderizar() {
        this.gameBoard.innerHTML = ''; // Limpa o tabuleiro existente
        this.renderizarNos();
    }

    // Renderiza os nós e suas conexões
    renderizarNos() {
        this.tabuleiro.nos.forEach(no => {
            const noDiv = document.createElement('div');
            noDiv.classList.add('no');
            noDiv.style.left = `${no.x}px`;
            noDiv.style.top = `${no.y}px`;
            noDiv.id = no.id;

            noDiv.textContent = no.id;

            if (no.state === 'player1') {
                noDiv.classList.add('player1');
            } else if (no.state === 'player2') {
                noDiv.classList.add('player2');
            }

            noDiv.addEventListener('click', () => this.tabuleiro.jogo.handleClick(no));
            this.gameBoard.appendChild(noDiv);
            no.element = noDiv;

            no.conexoes.forEach(conexao => this.desenharLinha(no, conexao));
        });
    }

    // Desenha a linha entre dois nós
    desenharLinha(no1, no2) {
        if (this.gameBoard.querySelector(`.linha[data-no1="${no1.id}"][data-no2="${no2.id}"]`) ||
            this.gameBoard.querySelector(`.linha[data-no1="${no2.id}"][data-no2="${no1.id}"]`)) {
            return;
        }

        const linha = document.createElement('div');
        linha.classList.add('linha');

        const dx = no2.x - no1.x;
        const dy = no2.y - no1.y;
        const comprimento = Math.sqrt(dx * dx + dy * dy);
        linha.style.width = `${comprimento}px`;
        linha.style.height = '2px';

        const angulo = Math.atan2(dy, dx) * (180 / Math.PI);
        linha.style.transform = `rotate(${angulo}deg)`;
        linha.style.left = `${no1.x}px`;
        linha.style.top = `${no1.y}px`;

        linha.dataset.no1 = no1.id;
        linha.dataset.no2 = no2.id;
        
        this.gameBoard.appendChild(linha);
    }

    // Define o estilo de uma casa ocupada pelo jogador atual
    atualizarCasaJogador(no) {
        no.element.classList.remove('destacar-verde'); // Remove piscar se estiver na fase 1
        no.element.classList.add(no.state);
    }

    // Remove o estilo de uma casa ocupada
    removerCasaJogador(no) {
        no.element.classList.remove('player1', 'player2');
    }

    // Adiciona o efeito de piscar verde a todas as casas livres
    aplicarTodosPiscarVerde() {
        this.tabuleiro.nos.forEach(no => {
            if (no.state === null) { // Verifica se a casa está livre
                no.element.classList.add('destacar-verde');
            }
        });
    }

    // Remove o efeito de piscar verde de todas as casas
    removerTodosPiscarVerde() {
        this.tabuleiro.nos.forEach(no => {
            no.element.classList.remove('destacar-verde');
        });
    }

    // Destaca os nós e as conexões de um moinho
    destacarMoinho(moinho) {
        moinho.forEach((no, index) => {
            // Aplica a classe de destaque nos nós
            no.element.classList.add('destacar-amarelo');
            
            // Destaca as conexões entre os nós do moinho
            if (index < moinho.length - 1) {
                const proximoNo = moinho[index + 1];
                this.destacarConexao(no, proximoNo);
            }
        });
    }

    // Destaca uma conexão como parte de um moinho
    destacarConexao(no1, no2) {
        const linha = Array.from(this.gameBoard.querySelectorAll('.linha')).find(
            l => (l.dataset.no1 === no1.id && l.dataset.no2 === no2.id) ||
                 (l.dataset.no1 === no2.id && l.dataset.no2 === no1.id)
        );
        if (linha) {
            linha.classList.add('linha-destacar-amarelo');
        }
    }
    
    // Remove o destaque do moinho e suas conexões
    removerDestaqueMoinho(moinho) {
        moinho.forEach((no, index) => {
            no.element.classList.remove('destacar-amarelo');
            if (index < moinho.length - 1) {
                const proximoNo = moinho[index + 1];
                this.removerDestaqueConexao(no, proximoNo);
            }
        });
    }

    // Remove o destaque de uma conexão
    removerDestaqueConexao(no1, no2) {
        const linha = Array.from(this.gameBoard.querySelectorAll('.linha')).find(
            l => (l.dataset.no1 === no1.id && l.dataset.no2 === no2.id) ||
                 (l.dataset.no1 === no2.id && l.dataset.no2 === no1.id)
        );
        if (linha) {
            linha.classList.remove('linha-destacar-amarelo');
        }
    }

    faseUm() {
        this.renderizar();
        this.aplicarTodosPiscarVerde();
    }

    // Adiciona a classe `capturavel-vermelho` aos nós especificados na lista
    destacarCapturaveis(listaNosCapturaveis) {
        listaNosCapturaveis.forEach(no => {
            no.element.classList.add('capturavel-vermelho');
        });
    }

    // Remove a classe `capturavel-vermelho` dos nós especificados na lista
    removerDestacarCapturaveis(listaNosCapturaveis) {
        listaNosCapturaveis.forEach(no => {
            no.element.classList.remove('capturavel-vermelho');
        });
    }

    destacarNoSelecionado(no) {
        no.element.classList.add('destacar-selecao-verde')
    }

    removerNoSelecionado(no) {
        no.element.classList.remove('destacar-selecao-verde')
    }

    destacarMovimentosValidos(nos) {
        nos.forEach(no => {
            no.element.classList.add('destacar-verde');
        });
    }

    // Função para remover a classe de piscar verde
    removerMovimentosValidos(nos) {
        nos.forEach(no => {
            no.element.classList.remove('destacar-verde');
        });
    }

    // Renderiza as peças restantes para cada jogador
    renderizarPecasPorColocar(pecasJogador1, pecasJogador2) {
        this.pecasJogador1Container.innerHTML = ''; // Limpa as peças antigas
        this.pecasJogador2Container.innerHTML = '';

        // Renderiza as peças de cada jogador
        for (let i = 0; i < pecasJogador1; i++) {
            const peca = document.createElement('div');
            peca.classList.add('peca', 'player1');
            this.pecasJogador1Container.appendChild(peca);
        }

        for (let i = 0; i < pecasJogador2; i++) {
            const peca = document.createElement('div');
            peca.classList.add('peca', 'player2');
            this.pecasJogador2Container.appendChild(peca);
        }
    }
   
    // Renderiza as peças restantes para cada jogador
    renderizarPecasCapturadas(capturadas1, capturadas2) {
        this.pecasCapturadas1.innerHTML = '';
        this.pecasCapturadas2.innerHTML = '';
        
        for (let i = 0; i < capturadas1; i++) {
            const peca = document.createElement('div');
            peca.classList.add('peca', 'player2');
            this.pecasCapturadas1.appendChild(peca);
        }

        for (let i = 0; i < capturadas2; i++) {
            const peca = document.createElement('div');
            peca.classList.add('peca', 'player1');
            this.pecasCapturadas2.appendChild(peca);
        }
    }
    
}

let pontosJogador1 = 0;
let pontosJogador2 = 0;


class Jogo {
    constructor(numNiveis, firstPlayer, mode, aiDifficulty, show) {
        this.fase = 1;  // fase 1 = drop, fase 2 = move
        this.previous = 1
        this.jogadorAtual = firstPlayer;
        this.myTurn = 'player1';
        this.numNiveis = numNiveis;
        this.totalPecas =  3 * numNiveis * 2;
        this.porJogador1 = 3 * numNiveis;
        this.porJogador2 = 3 * numNiveis;
        this.pecasJogador1 = 0; // conta o número de peças em jogo do jogador 1
        this.pecasJogador2 = 0; // conta o número de peças em jogo do jogador 2
        this.capturadas1 = 0;
        this.capturadas2 = 0;
        this.moinhosAtivos = []; // Guarda os moinhos ativos
        this.noSelecionado = null;  //Armazena a peça selecionada para mover (fase 2)
        this.movimentosValidos = []; // Guarda os movimentos válidos da fase 2
        this.contadorEmpate = 0;
        this.game_mode = mode;
        this.tabuleiro = new Tabuleiro(numNiveis, this, show);
        if (show) {
            this.tabuleiro.rend.faseUm();
            this.tabuleiro.rend.renderizarPecasPorColocar(this.porJogador1, this.porJogador2);
            this.tabuleiro.rend.renderizarPecasCapturadas(this.capturadas1, this.capturadas2);
            console.log(`Game mode ${this.game_mode} and size ${this.numNiveis}`);
            console.log("Jogo iniciado. Fase 1 - Colocação de peças.")  // controlo
            this.dificuldade = aiDifficulty;
            if (this.game_mode === 'pve') {
                this.escolherDificuldade();
                if (this.jogadorAtual === 'player2') {
                    this.jogadaIA(); 
                    this.atualizarInteracaoNos();
                } 
            } else if (this.game_mode === 'pvs') {
                if (this.jogadorAtual === 'player2') {
                    this.atualizarInteracaoNos();
                }
            }
        }
    }

    trocarJogador() {
        this.jogadorAtual = this.jogadorAtual === 'player1' ? 'player2' : 'player1';
        console.log(`Trocou player`);
        atualizarMensagemInterface(this.jogadorAtual, this.fase);
        
        if (this.game_mode === 'pve') {
            this.atualizarInteracaoNos();
            if (this.jogadorAtual === 'player2') {this.jogadaIA();}
        }

        if (this.game_mode === 'pvs') {
            this.atualizarInteracaoNos();
        }
    }

    escolherDificuldade() {
        if (this.dificuldade === 'easy') {
            this.ia = new easy_mode();
            console.log(`Game mode EASY`);
        } else if (this.dificuldade === 'medium') {
            this.ia = new medium_mode();
            console.log(`Game mode MEDIUM`);
        } else {
            this.ia = new hard_mode();
            console.log(`Game mode HARD`);
        }
    }
    
    // Ativa ou desativa os nós com base no jogador atual
    atualizarInteracaoNos() {
        this.tabuleiro.nos.forEach(no => {
            if (this.jogadorAtual === 'player1') {
                // Ativa o clique ajustando o estilo e remove a classe "desativado"
                no.element.style.pointerEvents = 'auto';
                no.element.classList.remove('desativado');
            } else {
                // Desativa o clique ajustando o estilo e adiciona a classe "desativado"
                no.element.style.pointerEvents = 'none';
                no.element.classList.add('desativado');
            }
        });
    }

    colocarPeca(no) {
        if (this.fase === 1 && no.state === null) {
            no.state = this.jogadorAtual;
            this.tabuleiro.rend.atualizarCasaJogador(no)
            console.log(`Peça do ${this.jogadorAtual} colocada no nó ${no.id}`);    // controlo

            this.atualizarContagemPecas()

            // Atualiza a área lateral de peças
            this.tabuleiro.rend.renderizarPecasPorColocar(this.porJogador1, this.porJogador2);

            // Remove o efeito de piscar verde do nó onde a peça foi colocada
            no.element.classList.remove('destacar-verde');

            this.verificarFaseMovimento()

            // Vamos ver se foi criado um moinho
            
            //if (this.verificarMoinho(no, false)) {
            //    if (this.game_mode === 'pve' && this.jogadorAtual === 'player2') {
            //        this.ia.capturarPeca(this);
            //    } else  {
            //        this.iniciarFase3();
            //    }
            //} else  {
            //    this.trocarJogador();
            //}
            //console.log(`Player =  ${this.jogadorAtual}, Eu sou o  = ${this.myTurn}`);
            if (this.jogadorAtual == this.myTurn) {
                this.notifyServer(no.id);
            }
            this.trocarJogador();

        } else {
            console.log("Movimento inválido. Escolha uma casa vazia.")  // controlo
        }
    }

    // Atualizar a contagem das peças do jogador atual
    atualizarContagemPecas() {
        if (this.jogadorAtual === 'player1') {
            this.pecasJogador1++;
            this.porJogador1--;
        } else {
            this.pecasJogador2++;
            this.porJogador2--;
        }
        this.totalPecas--;
        console.log(`total peças = ${this.totalPecas}`)   // controlo
    }

    // Verificar se a fase 1 já acabou
    verificarFaseMovimento() {
        if (this.totalPecas === 0) {
            console.log("Todas as peças foram jogadas")   // controlo
            this.tabuleiro.rend.removerTodosPiscarVerde();
            this.fase = 2;  // a fase de colocação das peças acabou, vamos passar para a movimentação
            console.log("Iniciando Fase 2 - Movimento de peças.")   // controlo
        }
    }

    // Esta função vê se a peça colocada gerou um moinho, se isso acontecer as borders dessas peças ficam amarelas
    verificarMoinho(no, test) {
        const jogador = no.state;
        if (!jogador) return false; // Se o nó está vazio, não verifica moinho

        // Função auxiliar para expandir a busca em uma direção (horizontal ou vertical)
        const expandirBusca = (noInicial, eixo) => {
            let listaMoinho = [noInicial];
            let index = 0;

            while (index < listaMoinho.length) {
                const noAtual = listaMoinho[index];
                index++;

                // Para cada conexão do nó atual
                noAtual.conexoes.forEach(conexao => {
                    // Verifica se a conexão tem o mesmo estado e está no mesmo eixo (y ou x)
                    if (conexao.state === jogador && 
                        !listaMoinho.includes(conexao) &&  // Evita duplicados
                        ((eixo === 'horizontal' && conexao.y === noInicial.y) ||
                        (eixo === 'vertical' && conexao.x === noInicial.x))) {
                        listaMoinho.push(conexao);
                    }
                });
            }
            return listaMoinho;
        };

        // Expande a busca em ambas as direções
        const moinhoHorizontal = expandirBusca(no, 'horizontal');
        const moinhoVertical = expandirBusca(no, 'vertical');

        let m = false;  // saber se criou moinho ou não (podem ser criados 2 um na vertical e outro na horizontal)

        // Verifica se há um moinho (precisamos de exatamente 3 nós conectados)
        if (moinhoHorizontal.length >= 3) {
            if (test === false) {
                this.adicionarMoinho(moinhoHorizontal.slice(0,3))
                console.log(`Moinho horizontal formado pelo ${jogador} no nó ${no.id}`);
            }
            m = true;
        }

        if (moinhoVertical.length >= 3) {
            if (test === false) {
                this.adicionarMoinho(moinhoVertical.slice(0,3))
                console.log(`Moinho vertical formado pelo ${jogador} no nó ${no.id}`);
            }
            m = true
        }
        
        return m; // Indica se um moinho foi formado
    }

    // Adiciona o moinho ao jogo
    adicionarMoinho(moinho) {
        // Ordena os nós por localização (primeiro `y`, depois `x`)
        moinho.sort((a, b) => {
            if (a.y === b.y) {
                return a.x - b.x;
            }
            return a.y - b.y;
        });

        // Adiciona o moinho à lista de moinhos ativos e aplica o destaque
        this.moinhosAtivos.push(moinho);
        moinho.forEach(no => no.moinho = true);
        this.tabuleiro.rend.destacarMoinho(moinho);
    }

    // Atualiza os moinhos afetados após movimento
    removerMoinhos() {
        this.moinhosAtivos.forEach(moinho => {
            // Remove o destaque visual do moinho
            this.tabuleiro.rend.removerDestaqueMoinho(moinho);
            moinho.forEach(no => no.moinho = false)
        })
        this.moinhosAtivos = []
    }

    iniciarFase3() {
        this.previous = this.fase;
        this.fase = 3;
        let jogadorOposto = this.jogadorAtual === 'player1' ? 'player2' : 'player1';   //Ir buscar a pessoa a quem podemos remover peças
        console.log(`Entrou fase 3 com ${jogadorOposto}`);

        let listaNosCapturaveis = this.tabuleiro.nos.filter(no => no.state === jogadorOposto);

        if (this.previous === 1) {this.tabuleiro.rend.removerTodosPiscarVerde();}

        // Destaca os nós capturáveis em vermelho
        this.tabuleiro.rend.destacarCapturaveis(listaNosCapturaveis);
        console.log("Iniciando Fase 3 - Captura de peças.");
        
        // Armazena a lista para remover o destaque posteriormente
        this.listaNosCapturaveis = listaNosCapturaveis;

        atualizarMensagemInterface(this.jogadorAtual, this.fase);
    }

    // Retirar uma peça ao adversário
    capturarPeca(no) {
        // Apenas aceita a peça se não estiver num moinho ou se só houver moinhos
        let jogadorOposto = this.jogadorAtual === 'player1' ? 'player2' : 'player1';
        if (no.state === jogadorOposto) {
            no.state = null;    // Remove a peça do tabuleiro
            this.tabuleiro.rend.removerCasaJogador(no);
            this.pecaCapturada();
            this.tabuleiro.rend.renderizarPecasCapturadas(this.capturadas1, this.capturadas2);

            console.log(`Peça do ${jogadorOposto} capturada no nó ${no.id}`);   // controlo
    
            // Atualiza o número de peças do jogador adversário
            if (jogadorOposto === 'player1') {
                this.pecasJogador1--;
            } else {
                this.pecasJogador2--;
            }

            if (this.jogadorAtual == this.myTurn) {
                this.notifyServer(no.id);
            }

            this.finalizarFase3();

        } else {
            console.log("Peça inválida para captura. Selecione outra peça do adversário.");
        }
    }

    // Atualiza os contadores de peças capturadas (para a renderização)
    pecaCapturada() {
        if (this.jogadorAtual == 'player1') {
            this.capturadas1 += 1;
        } else {
            this.capturadas2 += 1;
        }
    }

    finalizarFase3() {
        // Apenas retorna à fase 2 após a captura
        if (this.previous === 1) {
            this.fase = 1; // Garante que a fase seja mantida como 1 após a fase de captura
            this.tabuleiro.rend.aplicarTodosPiscarVerde();
        } else if (this.previous === 2) {
            this.fase = 2; // Garante o retorno à fase de movimentação
        }

        // Remove o destaque vermelho dos nós capturáveis
        if (this.listaNosCapturaveis) {
            this.tabuleiro.rend.removerDestacarCapturaveis(this.listaNosCapturaveis);
            this.listaNosCapturaveis = null; // Limpa a lista
        }

        if (this.fase === 1) {this.tabuleiro.rend.aplicarTodosPiscarVerde();}

        this.removerMoinhos();
        console.log("Finalizando Fase 3 - Captura concluída.");
        this.trocarJogador();
        this.verificarFimDoJogo();
    }

    // Seleciona uma peça para mover e destaca movimentos válidos
    selecionarPecaParaMover(no) {
        if (no.state === this.jogadorAtual) {
            this.noSelecionado = no;
            this.tabuleiro.rend.destacarNoSelecionado(no);
            console.log(`Peça do ${this.jogadorAtual} selecionada no nó ${no.id}`);
            
            // Destaca os movimentos válidos a partir da peça selecionada
            this.movimentosValidos = this.encontrarMovimentosValidos(no);
            // Usando um pequeno atraso para suavizar a transição
            setTimeout(() => {
                this.tabuleiro.rend.destacarMovimentosValidos(this.movimentosValidos);
                this.movimentosValidos = this.encontrarMovimentosValidos(no);
            }, 100); // 100ms de atraso, ajuste conforme necessário

            if (this.jogadorAtual == this.myTurn) {
                console.log(`Player =  ${this.jogadorAtual}, Eu sou o  = ${this.myTurn}`);
                this.notifyServer(no.id);
            }
        } else {
            console.log("Selecione uma de suas próprias peças para mover.");
        }
    }   
    
    removerSelecaoPecaParaMover(no) {
        console.log("Removeu a seleção da peça selecionada para mover")
        this.tabuleiro.rend.removerMovimentosValidos(this.movimentosValidos); // Remove destaque dos movimentos válidos anteriores
        this.noSelecionado.element.classList.remove('destacar-selecao-verde');
        this.noSelecionado = null;
        if (this.jogadorAtual == this.myTurn) {
            this.notifyServer(no.id);
        }
    }

    // Retorna os nós adjacentes e vazios (movimentos válidos)
    encontrarMovimentosValidos(no) {
        if ((this.jogadorAtual === 'player1' && this.pecasJogador1 === 3) ||
            (this.jogadorAtual === 'player2' && this.pecasJogador2 === 3)) {
            // Movimento livre para qualquer casa vazia
            return this.tabuleiro.nos.filter(nos => nos.state === null);
        } else {
            // Movimento restrito a casas adjacentes
            return no.conexoes.filter(conexao => conexao.state === null);
        }
    }

    // Movimenta a peça para o nó de destino
    moverPeca(no) {
        if (this.noSelecionado && this.movimentosValidos.includes(no)) {
            // Atualiza o estado dos nós de origem e destino
            no.state = this.jogadorAtual;
            // Caso o nó de origem tivesse moinhos, elimina-os
            this.noSelecionado.state = null;

            // Atualiza o tabuleiro visualmente
            this.tabuleiro.rend.removerCasaJogador(this.noSelecionado);
            this.tabuleiro.rend.atualizarCasaJogador(no);

            console.log(`Peça do ${this.jogadorAtual} movida para o nó ${no.id}`);

            if (this.jogadorAtual == this.myTurn) {
                this.notifyServer(no.id);
            }
            
            // Verifica se formou um moinho com o movimento
            if (this.verificarMoinho(no, false)) {
                if (this.game_mode === 'pve' && this.jogadorAtual === 'player2') {
                    this.ia.capturarPeca(this);
                } else  {
                    this.iniciarFase3();
                }
            } else {
                this.trocarJogador(); // Troca o turno
            }

            // Limpa a seleção
            this.tabuleiro.rend.removerNoSelecionado(this.noSelecionado);
            this.noSelecionado = null;
            this.tabuleiro.rend.removerMovimentosValidos(this.movimentosValidos);
            this.movimentosValidos = [];
            if (this.pecasJogador1 === 3 && this.pecasJogador2 === 3) {this.contadorEmpate++;}
                        
            this.verificarFimDoJogo();
        } else {
            console.log("Movimento inválido. Selecione uma casa vazia adjacente.");
        }
    }

    // Verifica as condições de termino do jogo
    verificarFimDoJogo() {
        if(this.previous === 1) {return;}
        // Verifica condições de vitória por número de peças
        if (this.pecasJogador1 < 3) {
            this.incrementarPontos('player2');
            console.log("Jogador 2 venceu!");
            alert("Jogador 2 venceu!");
            this.fimDoJogo();
            return;
        } else if (this.pecasJogador2 < 3) {
            this.incrementarPontos('player1');
            console.log("Jogador 1 venceu!");
            alert("Jogador 1 venceu!");
            this.fimDoJogo();
            return;
        }

        // Verifica se o jogador atual possui movimentos possíveis
        const jogadorAtual = this.jogadorAtual;
        const possuiMovimento = this.tabuleiro.nos.some(no => 
            no.state === jogadorAtual && this.encontrarMovimentosValidos(no).length > 0
        );

        if (!possuiMovimento) {
            this.incrementarPontos(vencedor);
            console.log(`O jogador ${jogadorAtual === 'player1' ? '2' : '1'} venceu por bloqueio de movimento!`);
            alert(`O jogador ${jogadorAtual === 'player1' ? '2' : '1'} venceu por bloqueio de movimento!`);
            this.fimDoJogo();
            return;
        }

        // Condição de empate
        if (this.pecasJogador1 === 3 && this.pecasJogador2 === 3) {
            console.log(`Perto de ser empate: ${this.contadorEmpate}`);
            if (this.contadorEmpate >= 10) {
                console.log("Empate! Nenhum vencedor.");
                alert("Empate! Nenhum vencedor.");
                this.fimDoJogo();
                return;
            }
        }
    }

    // Declara que o jogo terminou
    fimDoJogo() {
        // Desativa interações com o tabuleiro e nós
        this.tabuleiro.nos.forEach(no => {
            no.element.removeEventListener('click', this.handleClick.bind(this));
            no.element.classList.add('desativado'); // Adiciona um estilo de desativação
        });

        // Exibe um pop-up indicando que o jogo terminou e fornece opção para reiniciar
        setTimeout(() => {
            const jogarNovamente = confirm("O jogo terminou! Deseja jogar novamente?");
            
            if (jogarNovamente) {
                restartGame(config); // Reinicia o jogo com as configurações iniciais
            } else {
                alert("Obrigado por jogar!");
            }
        }, 100); // Pequeno atraso para garantir que a interface esteja pronta
    }

    // Função que gere os cliques nas peças consoante a fase de jogo
    handleClick(no) {
        if (this.jogadorAtual === 'player2' && this.game_mode === 'pve') {return;}
        if (this.fase === 1) {  // colocar peças
            this.colocarPeca(no);
        } else if (this.fase === 2) {   // mover peças
            // Caso ainda não haja uma peça selecionada para mover
            if (this.noSelecionado === null) {
                console.log("Selecionou um nó.");
                if (no.state === this.jogadorAtual) {
                    this.selecionarPecaParaMover(no);
                } else {
                    console.log("Selecione uma de suas próprias peças para mover.");
                }
            } 
            // Caso uma peça já esteja selecionada, verifica o clique em um movimento válido
            else if (this.movimentosValidos.includes(no)) {
                console.log("Vai mover uma peça");
                this.moverPeca(no);
            } 
            // Se o jogador clica em uma nova peça própria, redefine a seleção
            else if (no.state === this.jogadorAtual) {
                if (this.noSelecionado != null && no.id == this.noSelecionado.id) {
                    this.removerSelecaoPecaParaMover(no);
                }
                //console.log("Escolheu outro nó.");
                // Redefine a seleção anterior e destaca os movimentos da nova peça
                //this.selecionarPecaParaMover(no);
            } else {
                console.log("Movimento inválido. Selecione uma casa válida ou uma peça sua.");
            }
        } else if (this.fase === 3) {   // capturar uma peça (foi criado um moinho)
            this.capturarPeca(no);
        }
    }

    // Função para finalizar o jogo atual
    matarJogo() {
        // Limpa os nós
        if (this.tabuleiro && this.tabuleiro.nos) {
            this.tabuleiro.nos.forEach(no => {
                if (no.element) {
                    // Remove classes e event listeners dos elementos de cada nó
                    no.element.className = ''; // Remove todas as classes
                    no.element.removeEventListener('click', () => this.handleClick(no));
                }
            });
        }

        // Remove as linhas de conexão do DOM
        const linhas = document.querySelectorAll('.linha');
        linhas.forEach(linha => linha.remove());

        // Limpa o array de moinhos ativos e redefine estados necessários
        this.moinhosAtivos = [];
        console.log("Jogo finalizado e recursos limpos.");
    }

    async jogadaIA() {
        console.log("IA a jogar...");
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        // Executa a jogada da IA com base na fase atual
        if (this.fase === 1) {
            this.ia.colocarPeca(this);
        } else if (this.fase === 2) {
            this.ia.escolherPeca(this);
        }
    }

    // Função para retornar o jogador oponente
    jogadorOponente() {
        return this.jogadorAtual === 'player1' ? 'player2' : 'player1';
    }

    criarCopiaJogo() {
        // Cria uma nova instância do jogo para a cópia profunda
        const copiaJogo = new Jogo(this.numNiveis, this.jogadorAtual, this.game_mode, this.dificuldade, false);

        // Copia propriedades de estado primitivo
        copiaJogo.jogadorAtual = this.jogadorAtual;
        copiaJogo.fase = this.fase;
        copiaJogo.totalPecas = this.totalPecas;
        copiaJogo.porJogador1 = this.porJogador1;
        copiaJogo.porJogador2 = this.porJogador2;
        copiaJogo.pecasJogador1 = this.pecasJogador1;
        copiaJogo.pecasJogador2 = this.pecasJogador2;
        copiaJogo.capturadas1 = this.capturadas1;
        copiaJogo.capturadas2 = this.capturadas2;
        copiaJogo.contadorEmpate = this.contadorEmpate;

        // Realiza uma cópia profunda dos nós e de suas conexões
        copiaJogo.tabuleiro.nos = this.tabuleiro.nos.map(no => {
            const novoNo = new No(no.id, no.x, no.y);
            novoNo.state = no.state;
            novoNo.moinho = no.moinho;
            return novoNo;
        });

        // Restabelece as conexões entre os nós copiados
        copiaJogo.tabuleiro.nos.forEach((noCopiado, index) => {
            const noOriginal = this.tabuleiro.nos[index];
            noCopiado.conexoes = noOriginal.conexoes.map(conexaoOriginal => {
                const indexConexao = this.tabuleiro.nos.indexOf(conexaoOriginal);
                return copiaJogo.tabuleiro.nos[indexConexao];
            });
        });

        return copiaJogo;
    }

    getPontosJogador1() {
        return pontosJogador1;
    }

    getPontosJogador2() {
        return pontosJogador2;
    }

    incrementarPontos(vencedor) {
        if (vencedor === 'player1') {
            pontosJogador1++;
        } else {
            pontosJogador2++;
        }
    }

    // Transforma o id para que possa ser lido pelo server
    decodeNode(nodeID) {
        //console.log('DECODE nodeID = ', nodeID);
        let s = parseInt(nodeID.charAt(0), 10); // Primeiro caractere como número
        let p = parseInt(nodeID.charAt(1), 10); // Segundo caractere como número
        
        const square = Math.abs(s - this.numNiveis);
        if (p === 1) {
            p = 0;
        } else if (p === 2) {
            p = 1;
        } else if (p === 3) {
            p = 2;
        } else if (p === 4) {
            p = 7;
        } else if (p === 5) {
            p = 3;
        } else if (p === 7) {
            p = 5;
        } else if (p === 8) {
            p = 4;
        }
        //console.log('square = ', square);
        //console.log('position = ', p);
        let cell = {"square": square, "position": p};
        //console.log('DECODE cell = ', cell);

        return cell;
    }

    // Devolve o ID do nódulo no jogo criado
    encodeNode(cell) {
        let { square, position } = cell;
        let s = Math.abs(square - this.numNiveis);

        const positionMapping = {
            0: 1,
            1: 2,
            2: 3,
            7: 4,
            3: 5,
            5: 7,
            4: 8,
        };
        
        // Ajustar a posição usando o mapeamento, ou manter o valor original
        const adjustedPosition = positionMapping[position] || position;
        const id = `${s}${adjustedPosition}`;
        //console.log('EM ENCODE');
        //console.log('square = ', s);
        //console.log('position = ', adjustedPosition);
        //console.log('ENCODE nodeID = ', id);
        let node = this.tabuleiro.getNodeById(id);
        //console.log('NEW NODE id = ', node.id);

        return node;
    }

    // Função que notifica o servidor
    async notifyServer(cell) {
        if (this.game_mode === 'pvs') {
            const nick = sessionStorage.getItem('nick');
            const password = sessionStorage.getItem('password');
            const gameId = sessionStorage.getItem('gameId');
    
            if (!nick || !password || !gameId) {
                console.error('Dados de autenticação ou ID do jogo ausentes.');
                return;
            }
    
            const url = `${URL_GLOBAL}/notify`;
            const data = { "nick": nick, "password": password, "game": gameId, "cell": this.decodeNode(cell)};
            console.log(data);
            
            console.log('Jogada notificada com sucesso:', data.cell);
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
    
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Erro ao notificar o servidor');
                }
    
            } catch (error) {
                console.error('Erro ao notificar jogada:', error.message);
            }
        }
    }
}

// Faz jogadas random
class easy_mode {
    colocarPeca(jogo) {
        console.log("A usar easy mode.")
        const no = this.movimentoAleatorio(jogo.tabuleiro.nos.filter(no => no.state === null));
        jogo.colocarPeca(no);
    }

    capturarPeca(jogo) {
        jogo.iniciarFase3();
        setTimeout(() => {
            let jogadorOposto = this.jogadorAtual === 'player1' ? 'player2' : 'player1';
            const remove = this.movimentoAleatorio(jogo.tabuleiro.nos.filter(no => no.state === jogadorOposto));
            jogo.capturarPeca(remove);
        }, 1000); // 1000 milissegundos = 1 segundo
    }

    escolherPeca(jogo) {
        const no = this.movimentoAleatorio(jogo.tabuleiro.nos.filter(no => no.state === 'player2' && no.conexoes.some(conexao => conexao.state === null )));
        jogo.selecionarPecaParaMover(no);
        setTimeout(() => {
            const move = this.movimentoAleatorio(jogo.encontrarMovimentosValidos(no));
            jogo.moverPeca(move);
        }, 1000); // 1000 milissegundos = 1 segundo
    }

    // escolhe uma peça de uma lista aleatóriamente
    movimentoAleatorio(nosDisponiveis) {
        return nosDisponiveis[Math.floor(Math.random() * nosDisponiveis.length)];
    }
}

// Prioriza a criação de moinhos tanto na fase 1 como na fase 2
class medium_mode {
    colocarPeca(jogo) {
        console.log("A usar medium mode.");
        const jogadasValidas = jogo.tabuleiro.nos.filter(no => no.state === null);

        // Filtra jogadas que criam um moinho
        const jogadasParaMoinho = jogadasValidas.filter(no => {
            const copiaJogo = jogo.criarCopiaJogo();
            const index = jogo.tabuleiro.nos.indexOf(no);

            if (index !== -1) {
                copiaJogo.tabuleiro.nos[index].state = copiaJogo.jogadorAtual;
                return copiaJogo.verificarMoinho(copiaJogo.tabuleiro.nos[index], true);
            }
            return false;
        });

        // Escolhe a jogada
        const jogada = jogadasParaMoinho.length > 0
            ? jogadasParaMoinho[Math.floor(Math.random() * jogadasParaMoinho.length)]
            : jogadasValidas[Math.floor(Math.random() * jogadasValidas.length)];

        jogo.colocarPeca(jogada);
    }

    escolherPeca(jogo) {
        const pecasMoviveis = jogo.tabuleiro.nos.filter(no =>
            no.state === jogo.jogadorAtual && jogo.encontrarMovimentosValidos(no).length > 0
        );

        let melhorMovimento = null;
        let noSelecionado = null;

        for (let no of pecasMoviveis) {
            const movimentosValidos = jogo.encontrarMovimentosValidos(no);
            for (let movimento of movimentosValidos) {
                const copiaJogo = jogo.criarCopiaJogo();
                const indexNo = jogo.tabuleiro.nos.indexOf(no);
                const indexMovimento = jogo.tabuleiro.nos.indexOf(movimento);

                if (indexNo !== -1 && indexMovimento !== -1) {
                    copiaJogo.tabuleiro.nos[indexMovimento].state = jogo.jogadorAtual;
                    copiaJogo.tabuleiro.nos[indexNo].state = null;

                    if (copiaJogo.verificarMoinho(copiaJogo.tabuleiro.nos[indexMovimento])) {
                        melhorMovimento = movimento;
                        noSelecionado = no;
                        break;
                    }
                }
            }
            if (melhorMovimento) break;
        }

        if (!melhorMovimento) {
            noSelecionado = pecasMoviveis[Math.floor(Math.random() * pecasMoviveis.length)];
            const movimentosValidos = jogo.encontrarMovimentosValidos(noSelecionado);
            melhorMovimento = movimentosValidos[Math.floor(Math.random() * movimentosValidos.length)];
        }

        jogo.selecionarPecaParaMover(noSelecionado);
        setTimeout(() => jogo.moverPeca(melhorMovimento), 1000);
    }

    capturarPeca(jogo) {
        jogo.iniciarFase3();
        setTimeout(() => {
            let jogadorOposto = this.jogadorAtual === 'player1' ? 'player2' : 'player1';
            const remove = this.movimentoAleatorio(jogo.tabuleiro.nos.filter(no => no.state === jogadorOposto));
            jogo.capturarPeca(remove);
        }, 1000);
    }

    movimentoAleatorio(nosDisponiveis) {
        return nosDisponiveis[Math.floor(Math.random() * nosDisponiveis.length)];
    }
}

// Prioriza a criação de moinhos e o bloqueio do oponente
class hard_mode {
    colocarPeca(jogo) {
        console.log("A usar hard mode.");
        const jogadasValidas = jogo.tabuleiro.nos.filter(no => no.state === null);

        const jogadasParaMoinho = jogadasValidas.filter(no => {
            const copiaJogo = jogo.criarCopiaJogo();
            const index = jogo.tabuleiro.nos.indexOf(no);

            if (index !== -1) {
                copiaJogo.tabuleiro.nos[index].state = copiaJogo.jogadorAtual;
                return copiaJogo.verificarMoinho(copiaJogo.tabuleiro.nos[index]);
            }
            return false;
        });

        const jogadasParaBloquear = jogadasValidas.filter(no => {
            const copiaJogo = jogo.criarCopiaJogo();
            const index = jogo.tabuleiro.nos.indexOf(no);

            if (index !== -1) {
                copiaJogo.tabuleiro.nos[index].state = jogo.jogadorOponente();
                return copiaJogo.verificarMoinho(copiaJogo.tabuleiro.nos[index]);
            }
            return false;
        });

        const jogada = jogadasParaMoinho.length > 0
            ? jogadasParaMoinho[Math.floor(Math.random() * jogadasParaMoinho.length)]
            : (jogadasParaBloquear.length > 0
                ? jogadasParaBloquear[Math.floor(Math.random() * jogadasParaBloquear.length)]
                : jogadasValidas[Math.floor(Math.random() * jogadasValidas.length)]);

        jogo.colocarPeca(jogada);
    }

    escolherPeca(jogo) {
        const pecasMoviveis = jogo.tabuleiro.nos.filter(no =>
            no.state === jogo.jogadorAtual && jogo.encontrarMovimentosValidos(no).length > 0
        );

        let melhorMovimento = null;
        let noSelecionado = null;

        for (let no of pecasMoviveis) {
            const movimentosValidos = jogo.encontrarMovimentosValidos(no);
            for (let movimento of movimentosValidos) {
                const copiaJogo = jogo.criarCopiaJogo();
                const indexNo = jogo.tabuleiro.nos.indexOf(no);
                const indexMovimento = jogo.tabuleiro.nos.indexOf(movimento);

                if (indexNo !== -1 && indexMovimento !== -1) {
                    copiaJogo.tabuleiro.nos[indexMovimento].state = jogo.jogadorAtual;
                    copiaJogo.tabuleiro.nos[indexNo].state = null;

                    if (copiaJogo.verificarMoinho(copiaJogo.tabuleiro.nos[indexMovimento])) {
                        melhorMovimento = movimento;
                        noSelecionado = no;
                        break;
                    }
                }
            }
            if (melhorMovimento) break;
        }

        if (!melhorMovimento) {
            noSelecionado = pecasMoviveis[Math.floor(Math.random() * pecasMoviveis.length)];
            const movimentosValidos = jogo.encontrarMovimentosValidos(noSelecionado);
            melhorMovimento = movimentosValidos[Math.floor(Math.random() * movimentosValidos.length)];
        }

        jogo.selecionarPecaParaMover(noSelecionado);
        setTimeout(() => jogo.moverPeca(melhorMovimento), 1000);
    }

    capturarPeca(jogo) {
        jogo.iniciarFase3();
        setTimeout(() => {
            const jogadorOposto = jogo.jogadorAtual === 'player1' ? 'player2' : 'player1';
            const pecasParaCapturar = jogo.tabuleiro.nos.filter(no => no.state === jogadorOposto);
            const alvo = pecasParaCapturar[Math.floor(Math.random() * pecasParaCapturar.length)];
            jogo.capturarPeca(alvo);
        }, 1000);
    }

    movimentoAleatorio(nosDisponiveis) {
        return nosDisponiveis[Math.floor(Math.random() * nosDisponiveis.length)];
    }
}


// ----------------------------------------------------------------------------------
// ---------------------------CONFIGURAÇÕES-----------------------------------------
// ----------------------------------------------------------------------------------


// Lógica para exibir/ocultar configurações de IA
document.getElementById('player-vs-ai').addEventListener('change', function () {
    document.querySelector('.ia-settings').classList.remove('hidden');
});

document.getElementById('player-vs-player').addEventListener('change', function () {
    document.querySelector('.ia-settings').classList.add('hidden');
});

// Lógica para salvar configurações
document.getElementById('save-settings').addEventListener('click', function() {
    // Obter as configurações selecionadas
    const boardSize = document.getElementById('board-size').value;
    const gameMode = document.querySelector('input[name="game-mode"]:checked').value;
    const aiDifficulty = document.getElementById('ai-difficulty').value;
    const firstPlayer = document.getElementById('first-player').value;

    // Exemplo de aplicação das configurações (você pode adaptar isso)
    console.log({
        boardSize,
        gameMode,
        aiDifficulty,
        firstPlayer
    });

    // Fechar o pop-up
    closeSettingsPopup();

    // Reiniciar o tabuleiro (implemente a lógica do reinício conforme necessário)
    restartGame(config);
});


const config = new ConfiguracaoJogo(); // Cria a configuração com valores padrão
// Inicia o jogo automaticamente ao carregar a página
//document.addEventListener('DOMContentLoaded', function() {
    //restartGame(config);  // Inicia o jogo com a configuração padrão
//});



// ----------------------------------------------------------------------------------
// ---------------------------DESISTIR-----------------------------------------------
// ----------------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    const resignGameBtn = document.getElementById("resign-game"); // Botão de desistência
    const confirmResignPopup = document.getElementById("confirm-resign-popup");
    const confirmResignYes = document.getElementById("confirm-resign-yes");
    const confirmResignNo = document.getElementById("confirm-resign-no");

    let isServerMode = false; // Track if the game is in server mode

    // Detect game mode and update `isServerMode`
    const playOfflineButton = document.getElementById('play-offline');
    const playOnlineButton = document.getElementById('play-online');
    const playCostumButton = document.getElementById('play-custom-server');

    playOfflineButton.addEventListener("click", () => {
        sessionStorage.removeItem('nick');
        sessionStorage.removeItem('opponentNick');
        sessionStorage.removeItem('gameId')
        isServerMode = false;
    });

    playOnlineButton.addEventListener("click", () => {
        isServerMode = true;
    });

    playCostumButton.addEventListener("click", () => {
        isServerMode = true;
    });

    // Function to handle resignation
    async function handleResignation() {
        if (isServerMode) {
            await leaveServer();
        } else {
            // Offline mode: Award points to the opponent
            jogoAtual.incrementarPontos(jogoAtual.jogadorOponente());
            console.log("Desistência no modo offline. Vitória atribuída ao adversário.");
            location.reload(); // Restart the game
        }

        // Hide the popup
        confirmResignPopup.classList.add("hidden");
        confirmResignPopup.style.display = "none";
    }

    // Open resignation confirmation popup
    resignGameBtn.addEventListener("click", () => {
        confirmResignPopup.classList.remove("hidden");
        confirmResignPopup.style.display = "block";
    });

    // Handle "Yes" (Confirm resignation)
    confirmResignYes.addEventListener("click", () => {
        handleResignation();
    });

    // Handle "No" (Cancel resignation)
    confirmResignNo.addEventListener("click", () => {
        confirmResignPopup.classList.add("hidden");
        confirmResignPopup.style.display = "none";
    });
});


// ----------------------------------------------------------------------------------
// ---------------------------POP-UP-------------------------------------------------
// ----------------------------------------------------------------------------------

// Função para mostrar o pop-up de configurações
function showSettingsPopup(mode) {
    const iaSettings = document.querySelector('.ia-settings');
    const gameModeSettings = document.querySelectorAll('input[name="game-mode"]');
    const firstPlayerSettings = document.getElementById('first-player');
    const playerVsPlayerOption = document.getElementById('player-vs-player');

    if (mode === 'online') {
        // Hide AI settings and game mode options for online play
        iaSettings.classList.add('hidden');
        gameModeSettings.forEach(setting => setting.parentElement.classList.add('hidden'));
        firstPlayerSettings.parentElement.classList.add('hidden');
    } else if (mode === 'offline') {
        // Show AI settings and game mode options for offline play
        iaSettings.classList.add('hidden'); // Initially hide AI settings
        gameModeSettings.forEach(setting => setting.parentElement.classList.remove('hidden'));
        firstPlayerSettings.parentElement.classList.remove('hidden');

        // Ensure the correct initial state based on the selected option
        if (playerVsPlayerOption.checked) {
            iaSettings.classList.add('hidden');
        }
    }

    document.getElementById('settings-popup').classList.remove('hidden');
    document.querySelector('.overlay').style.display = 'block';
}

// Evento para mostrar o pop-up de configurações quando o ícone é clicado
document.getElementById('settings-icon').addEventListener('click', function() {
    // Prevent settings popup in server mode
    const isServerMode = sessionStorage.getItem('gameId') !== null;
    if (isServerMode) {
        console.log("Settings cannot be changed in server mode.");
        return; // Exit function if in server mode
    }

    var instructionsImg = document.getElementById('instrucoes-img');
    if (instructionsImg.style.display === 'block') {
        instructionsImg.style.display = 'none';
    }
    
    showSettingsPopup();
});


// Fechar o pop-up ao clicar no botão "Fechar"
document.getElementById('close-popup').addEventListener('click', function() {
    closeSettingsPopup();
});

// Função para fechar o pop-up de configurações
function closeSettingsPopup() {
    document.getElementById('settings-popup').classList.add('hidden');
    document.querySelector('.overlay').style.display = 'none';
}

// Fechar o pop-up ao clicar fora dele
document.querySelector('.overlay').addEventListener('click', function() {
    closeSettingsPopup();
});

// Adicionando stopPropagation para o pop-up
document.getElementById('settings-popup').addEventListener('click', function(event) {
    event.stopPropagation();
});




// ----------------------------------------------------------------------------------
// ---------------------------SERVIDOR PROFESSOR-------------------------------------
// ----------------------------------------------------------------------------------



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', () => {
    const authScreen = document.getElementById('auth-screen');
    const authOptions = document.querySelector('.mode-buttons'); // Initial "Jogar Offline" & "Jogar no Servidor"
    const authActions = document.querySelector('.auth-actions'); // Buttons: Register and Login
    const authForm = document.getElementById('auth-form'); // Form with username/password
    const authError = document.getElementById('auth-error');
    const playOfflineButton = document.getElementById('play-offline');
    const playOnlineButton = document.getElementById('play-online');
    const playCustomServerButton = document.getElementById('play-custom-server');
    const registerButton = document.getElementById('register-button');
    const loginButton = document.getElementById('login-button');
    const submitButton = document.getElementById('submit-button'); // Dynamic button for login/register
    const backButton = document.getElementById('back-button'); // Back button

    let currentAction = ""; // To track whether it's a login or register action

    // Offline Mode: Starts the game directly
    playOfflineButton.addEventListener('click', () => {
        authScreen.style.display = 'none';
        updateOfflineUI(); // Update UI for offline mode
        showSettingsPopup('offline'); // Show full settings for offline mode
    
        // Show settings button in offline mode
        document.getElementById('settings-icon').style.display = 'block';
    });
    
    
    // Online Mode: Show Register/Login options
    playOnlineButton.addEventListener('click', () => {
        URL_GLOBAL = "http://twserver.alunos.dcc.fc.up.pt:8008";
        authOptions.classList.add('hidden'); // Hide mode selection
        authActions.classList.remove('hidden'); // Show Register/Login buttons
        
        const radio = document.getElementById('player-vs-server');
        if (radio) {
            radio.checked = true; // Marks the button for server mode
        }
    
        // Hide settings button in server mode
        document.getElementById('settings-icon').style.display = 'none';
    });

    playCustomServerButton.addEventListener('click', () => {
        URL_GLOBAL = "http://twserver.alunos.dcc.fc.up.pt:8112";
        authOptions.classList.add('hidden'); // Hide mode selection
        authActions.classList.remove('hidden'); // Show Register/Login buttons
        
        const radio = document.getElementById('player-vs-server');
        if (radio) {
            radio.checked = true; // Marks the button for server mode
        }
    
        // Hide settings button in server mode
        document.getElementById('settings-icon').style.display = 'none';
    });


    

    // Show form for Register
    registerButton.addEventListener('click', () => {
        currentAction = "register";
        authActions.classList.add('hidden'); // Hide Register/Login buttons
        authForm.classList.remove('hidden'); // Show the form
        submitButton.textContent = "Registrar"; // Update button text
    });

    // Show form for Login
    loginButton.addEventListener('click', () => {
        currentAction = "login";
        authActions.classList.add('hidden'); // Hide Register/Login buttons
        authForm.classList.remove('hidden'); // Show the form
        submitButton.textContent = "Entrar"; // Update button text
    });

    // Handle "Back" button
    backButton.addEventListener('click', () => {
        authForm.classList.add('hidden'); // Hide the form
        authActions.classList.remove('hidden'); // Show Register/Login buttons
        authForm.reset(); // Clear any input fields
    });

    // Lidar com o Login ou o Register
    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
    
        const nick = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value.trim();
        const boardSizeAuth = document.getElementById('board-size-auth').value;
    
        if (!nick || !password) {
            authError.textContent = 'Por favor, preencha todos os campos.';
            authError.classList.remove('hidden');
            return;
        }
    
        try {
            if (currentAction === "register") {
                await registerPlayer(nick, password);
                alert('Usuário registrado com sucesso! Agora você pode fazer login.');
    
                authForm.classList.add('hidden');
                authActions.classList.remove('hidden');
                authForm.reset();
            } else if (currentAction === "login") {
                await loginPlayer(nick, password);
                //alert(`Bem-vindo, ${nick}!`);
                authScreen.style.display = 'none';

                const boardSizeSelect = document.getElementById('board-size');
                if (boardSizeSelect) {
                    boardSizeSelect.value = boardSizeAuth;
                }
    
                // Handle multiplayer game start
                await handleMultiplayerStart(nick, password);
            }
    
            authError.classList.add('hidden');
        } catch (error) {
            authError.textContent = error.message || 'Erro ao processar.';
            authError.classList.remove('hidden');
        }
    });
    
});


// Function to update UI after authentication
function updateAuthUI(nick) {
    const authWelcome = document.querySelector('.auth-welcome');
    const welcomeMessage = document.querySelector('.welcome-message');
    const leaveGameButton = document.getElementById('leave-game-button');
    const logoutButton = document.getElementById('logout-button');

    // Update the welcome message
    welcomeMessage.innerHTML = `Bem-vindo ao Nine Men's Morris, <b>${nick}</b>!`;

    // Show the welcome section
    authWelcome.classList.remove('hidden');
    leaveGameButton.classList.remove('hidden');
    logoutButton.classList.remove('hidden');

    // Add event listener to the "Abandonar Jogo" button
    leaveGameButton.addEventListener('click', async () => {
        try {
            const nick = sessionStorage.getItem('nick');
            const password = sessionStorage.getItem('password');
            const gameId = sessionStorage.getItem('gameId');

            console.log(`Attempting to leave game: Nick: ${nick}, Password: ${password}, Game ID: ${gameId}`);

            if (!nick || !password || !gameId) {
                alert("Você não está em um jogo ativo.");
                return;
            }

            await leaveServer();
            alert("Você saiu do jogo com sucesso.");

            // Clear session data and reload the page
            sessionStorage.clear();
            location.reload();
        } catch (error) {
            console.error('Erro ao abandonar o jogo:', error.message);
            alert(`Erro ao abandonar o jogo: ${error.message}`);
        }
    });

    // Add event listener to the "Logout" button
    logoutButton.addEventListener('click', async () => {
        try {
            const nick = sessionStorage.getItem('nick');
            const password = sessionStorage.getItem('password');
            const gameId = sessionStorage.getItem('gameId');

            console.log(`Attempting to leave game: Nick: ${nick}, Password: ${password}, Game ID: ${gameId}`);

            if (!nick || !password || !gameId) {
                alert("Você não está em um jogo ativo.");
                return;
            }

            await leaveServer();
            alert("Você saiu do jogo com sucesso.");

            // Clear session data and reload the page
            sessionStorage.clear();
            location.reload();
        } catch (error) {
            console.error('Erro ao abandonar o jogo:', error.message);
            alert(`Erro ao abandonar o jogo: ${error.message}`);
        }
    });
}


// Esta função é responsável por começar o jogo offline e levar para as configurações
function updateOfflineUI() {
    // Reset game configuration
    config.resetConfiguracoes();
    restartGame(config);

    // Reset nicknames and scores
    sessionStorage.removeItem('nick');
    sessionStorage.removeItem('opponentNick');
    pontosJogador1 = 0; // Reset Player 1 points
    pontosJogador2 = 0; // Reset Player 2 points

    // Update UI
    const authContainer = document.querySelector('.auth');
    authContainer.innerHTML = `
        <div class="auth-welcome">
            <button id="logout-button" class="logout-button">Abandonar</button>
        </div>
    `;

    // Event listener to abandon game
    document.getElementById('logout-button').addEventListener('click', () => {
        alert('Sessão Terminada!');
        sessionStorage.clear(); // Clear session data
        location.reload(); // Reload page
    });

    // Update the message interface to reset to Player 1 and Player 2
    atualizarMensagemInterface('player1', 1);
}


function showWaitingMessage() {
    const waitingMessage = document.getElementById('waiting-message');
    if (waitingMessage) {
        waitingMessage.classList.remove('hidden');
        //console.log('Waiting message shown');
    } 
}

function hideWaitingMessage() {
    const waitingMessage = document.getElementById('waiting-message');
    if (waitingMessage) {
        waitingMessage.classList.add('hidden');
        //console.log('Waiting message hidden');
    }
}



// Function to register a player
async function registerPlayer(nick, password) {
    const url = `${URL_GLOBAL}/register`;
    const data = { nick, password };

    try {
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao registrar jogador');
        }

        console.log('Jogador registrado com sucesso!');
    } catch (error) {
        throw new Error('Falha no registro: ' + error.message);
    }
}


// Function to log in a player using the registration endpoint
async function loginPlayer(nick, password) {
    const url =`${URL_GLOBAL}/register`;
    const data = { nick, password };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' ,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao fazer login');
        }

        console.log('Login efetuado com sucesso!');
    } catch (error) {
        throw new Error('Falha no login: ' + error.message);
    }

}
// Function de dar leave
async function leaveServer() {
    const nick = sessionStorage.getItem("nick");
    const password = sessionStorage.getItem("password");
    const gameId = sessionStorage.getItem("gameId");

    if (!nick || !password || !gameId) {
        alert("Não foi possível processar a desistência no modo servidor.");
        location.reload(); // Reload the page if something goes wrong
        return;
    }

    try {
        // Notify the server of the resignation
        const response = await fetch(`${URL_GLOBAL}/leave`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nick, password, game: gameId }),
        });

        if (!response.ok) {
            const error = await response.json();
            
        }

        console.log("Desistência registada no servidor.");

        // Check the number of players
        const gameStateResponse = await fetch(
            `${URL_GLOBAL}/update?nick=${nick}&game=${gameId}`
        );

        if (gameStateResponse.ok) {
            const gameState = await gameStateResponse.json();

            if (gameState.players && Object.keys(gameState.players).length === 2) {
                // Two players in the game
                alert("Você desistiu do jogo. A vitória foi atribuída ao adversário.");


                // Fetch and update rankings after resignation
                loadRankingFromServer(group, size); // Adjust `group` and `size` as needed
                //location.reload(); 
            }
        }

    } catch (error) {
        console.log("Erro ao processar desistência:", error.message);
    } finally {
        location.reload(); // Always reload the page after resignation
    }
}

// Function to join a multiplayer game
async function joinGame(group , nick, password, size) {
    const url = `${URL_GLOBAL}/join`;
    const data = { "group": group, "nick": nick, "password": password, "size": size };
    console.log('Enviamos no LOGIN o size:', size);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao juntar-se ao jogo');
        }

        const result = await response.json();
        //console.log('Jogo iniciado com sucesso! À espera de outro jogador', result);
        return result;
    } catch (error) {
        console.error('Erro no pedido join:', error.message);
        alert(`Erro ao juntar-se ao jogo: ${error.message}`);
    }
}

// Esta função é responsável por receber mensagens do servidor
function startGameUpdate(nick, gameId) {
    sessionStorage.setItem("movement", "false");
    sessionStorage.setItem("capture", "false");
    console.log("MOVEMENT ESTÁ COMO: ", sessionStorage.getItem("movement"));
    const url = `${URL_GLOBAL}/update?nick=${nick}&game=${gameId}`;


    const eventSource = new EventSource(url);
    console.log('Conexão global de atualização iniciada.');

    eventSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Mensagem recebida do servidor:', data);

            if (data.players) {
                const players = Object.keys(data.players);
                const opponentNick = players.find(player => player !== nick);
                if (opponentNick) {
                    sessionStorage.setItem('opponentNick', opponentNick);
                }
            }

            // Pass the received data to handleGlobalUpdate
            handleGlobalUpdate(data, nick);
        } catch (error) {
            console.error('Erro ao processar mensagem do servidor:', error);
        }
    };

    eventSource.onerror = function(error) {
        console.error('Erro na conexão global de atualização:', error);
        setTimeout(() => startGameUpdate(nick, gameId), 5000);
    };

    return eventSource;
}


function handleGlobalUpdate(data, nick) {
    const m = sessionStorage.getItem("movement");

    // Check if the game ended or is invalid
    if (data.error === "Not a valid game" || data.winner) {
        console.log("O jogo foi encerrado ou inválido. Recarregando página...");
        stopInactivityTimer();
        alert(data.winner ? `O jogador ${data.winner} venceu o jogo!` : "O jogo terminou inesperadamente.");
        location.reload();
        return;
    }

    // Handle players update
    if (data.players) {
        const players = Object.keys(data.players);
        console.log(`Players connected: ${players.join(", ")}`);

        if (players.length === 2) {
            const nick = sessionStorage.getItem('nick');
            const opponentNick = players.find(player => player !== nick);
            sessionStorage.setItem('opponentNick', opponentNick);
        }

        if (players.length < 2) {
            console.log("O adversário saiu do jogo. Recarregando página...");
            stopInactivityTimer();
            alert("O adversário desistiu do jogo. Você venceu!");
            location.reload();
            return;
        }
    }

    // Board logic
    if (data.board) {
        const isBoardEmpty = data.board.every(row => row.every(cell => cell === 'empty'));
        if (isBoardEmpty) {
            console.log('O tabuleiro está completamente vazio. Inicializar visualização');

            const select = document.getElementById('first-player');
            if (select) {
                select.value = data.turn === nick ? 'player1' : 'player2';
            }

            const boardSizeSelect = document.getElementById('board-size');
            if (boardSizeSelect) {
                boardSizeSelect.value = data.board.length;
            }
            hideWaitingMessage();
            restartGame(config);
        } else {
            if (data.turn === nick) {
                console.log("É a sua vez de jogar.");
                startInactivityTimer(); // Start the inactivity timer

                console.log("Tabuleiro atual:");
                data.board.forEach(row => console.log(row.join(" ")));

                if (data.phase === "drop" || jogoAtual.fase === 1) {
                    const { square, position } = data.cell;
                    console.log(`PHASE = ${data.phase}, Square: ${square}, Position: ${position}`);
                    const move = jogoAtual.encodeNode(data.cell);
                    jogoAtual.colocarPeca(move);
                    startInactivityTimer(); // Reset timer after a move
                }

                if (data.phase === "move" && jogoAtual.fase !== 1 && data.step === "from" && m === "true") {
                    const move = jogoAtual.encodeNode(data.cell);
                    jogoAtual.moverPeca(move);
                    sessionStorage.setItem("movement", "false");
                    startInactivityTimer(); // Reset timer
                }

                if (data.phase === "move" && data.step === "from" && sessionStorage.getItem("capture") === "true") {
                    sessionStorage.setItem("capture", "false");
                    sessionStorage.setItem("movement", "false");
                    const move = jogoAtual.encodeNode(data.cell);
                    jogoAtual.capturarPeca(move);
                    startInactivityTimer(); // Reset timer
                }
            } else {
                console.log("Aguardando jogada do adversário.");
                stopInactivityTimer(); // Stop the timer for inactive player

                console.log("Tabuleiro atual:");
                data.board.forEach(row => console.log(row.join(" ")));

                if (data.phase === "move" && data.step === "to") {
                    const move = jogoAtual.encodeNode(data.cell);
                    jogoAtual.selecionarPecaParaMover(move);
                }

                if (data.phase === "move" && data.step === "from" && m === "true") {
                    const move = jogoAtual.encodeNode(data.cell);
                    jogoAtual.removerSelecaoPecaParaMover(move);
                }

                if (data.phase === "move" && data.step === "take") {
                    const move = jogoAtual.encodeNode(data.cell);
                    jogoAtual.moverPeca(move);
                    sessionStorage.setItem("capture", "true");
                    sessionStorage.setItem("movement", "false");
                }

                if (data.phase === "move" && m === "false") {
                    sessionStorage.setItem("movement", "true");
                }
            }
        }
    } else {
        showWaitingMessage();
    }

    // Check for a winner
    if (data.winner) {
        console.log(`Vencedor identificado: ${data.winner}`);
        stopInactivityTimer();
        alert(`O jogador ${data.winner} venceu o jogo!`);
    }
}

async function handleMultiplayerStart(nick, password) {
    const group = 12; // Adjust as needed
    config.carregarConfiguracoes();
    const size = config.getSize();  //Vamos buscar o valor que o jogador selecionou
    console.log(`O TAMANHO DO TABULEIRO VAI SER: ${size}`);

    try {
        showWaitingMessage();
        const result = await joinGame(group, nick, password, size);
        
        if (result && result.game) {
            sessionStorage.setItem('nick', nick);
            sessionStorage.setItem('password', password);
            sessionStorage.setItem('gameId', result.game);
            
            console.log(`Waitting for other player! Game ID: ${result.game}`);
            
            updateAuthUI(nick);
          
            //showSettingsPopup('online'); // Show limited settings for online mode
            startGameUpdate(nick, result.game);
           
        }
    } catch (error) {
        console.error(`Failed to start multiplayer game: ${error.message}`);
        alert(`Erro ao iniciar o jogo multiplayer: ${error.message}`);
        hideWaitingMessage();
    }
}

async function fetchRanking(group, size) {
    const url = `${URL_GLOBAL}/ranking`;
    const requestData = { group, size };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao buscar a tabela classificativa");
        }

        const data = await response.json();
        console.log("Ranking recebido:", data);
        return data.ranking;
    } catch (error) {
        console.error("Erro ao buscar ranking:", error.message);
        alert(`Erro ao buscar ranking: ${error.message}`);
        return [];
    }
}


function displayRankingTable(rankingData) {
    const rankingBody = document.getElementById("ranking-body");
    rankingBody.innerHTML = ""; // Clear previous content

    // Check if offline mode is active
    const isServerMode = sessionStorage.getItem("gameId") !== null;

    if (!isServerMode) {
        // Offline mode: Display Player 1 and Player 2 local scores
        rankingBody.innerHTML = `
            <tr><td>1</td><td>Player 1</td><td>${pontosJogador1}</td></tr>
            <tr><td>2</td><td>Player 2</td><td>${pontosJogador2}</td></tr>
        `;
        return;
    }

    // Server mode: Display fetched rankings
    if (rankingData.length === 0) {
        rankingBody.innerHTML = `<tr><td colspan="3">Ainda sem tabela classificativa</td></tr>`;
        return;
    }

    rankingData.forEach((player, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.nick}</td>
            <td>${player.victories}</td>
        `;
        rankingBody.appendChild(row);
    });
}



document.getElementById("show-rankings").addEventListener("click", async () => {
    const group = 12; 
    const boardSize = parseInt(document.getElementById('board-size').value) || 3; // Default size to 3

    const rankingData = await fetchRanking(group, boardSize);
    displayRankingTable(rankingData);

    document.getElementById("ranking-panel").classList.remove("hidden");
    document.getElementById("ranking-panel").style.display = "block";
});


let inactivityTimer = null;
let timeLeft = 120; // 120 seconds default timer

function startInactivityTimer() {
    // Clear any existing timer
    clearInterval(inactivityTimer);
    timeLeft = 120;

    // Show the timer on the screen
    const timerElement = document.getElementById('inactivity-timer');
    if (timerElement) {
        timerElement.style.display = 'block';
    }

    inactivityTimer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            timerElement.textContent = `Tempo restante para a próxima jogada : ${timeLeft} segundos`;
        } else {
            clearInterval(inactivityTimer);
            alert("Tempo esgotado! Você perdeu o turno por inatividade.");
            location.reload(); // Optional: Reload or handle inactivity
        }
    }, 1000);
}

function stopInactivityTimer() {
    clearInterval(inactivityTimer);
    timeLeft = 120;
    const timerElement = document.getElementById('inactivity-timer');
    if (timerElement) {
        timerElement.textContent = 'Tempo restante para a próxima jogada: 120 segundos';
        timerElement.style.display = 'none';
    }
}

// Function to update the timer display on the screen
function updateTimerDisplay() {
    const timerElement = document.getElementById("inactivity-timer");
    if (timerElement) {
        timerElement.textContent = `Tempo restante para a próxima jogada: ${timeLeft} segundos`;
    }
}
