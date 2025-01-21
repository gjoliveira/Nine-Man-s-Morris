
const { corsHeaders } = require('./utils/corsHeaders');
const http = require('http');
const url = require('url');
const { register, ranking, join, leave, notify, update } = require('./controllers/index');

const PORT = process.env.PORT || 8112;

// Função para enviar resposta JSON
const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, corsHeaders); 
    res.end(JSON.stringify(data));
};

// Servidor HTTP
http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    // Middleware para métodos inválidos
    if (!['POST', 'GET', 'OPTIONS'].includes(req.method)) {
        res.setHeader('Allow', 'POST, GET', 'OPTIONS');
        return sendResponse(res, 400, { error: 'Método inválido para este endpoint.' });
    }

    // Roteamento manual
    if (pathname === '/register' && req.method === 'POST') {
        register(req, res);
    } else if (pathname === '/ranking' && req.method === 'POST') {
        ranking(req, res);
    } else if (pathname === '/join' && req.method === 'POST') {
        join(req, res);
    } else if (pathname === '/leave' && req.method === 'POST') {
        leave(req, res);
    } else if (pathname === '/notify' && req.method === 'POST') {
        notify(req, res);
    } else if (pathname === '/update' && req.method === 'GET') {
        update(req, res);
    } else if (req.method === 'OPTIONS') {
	sendResponse(res, 200, corsHeaders);
    }else {
        sendResponse(res, 404, { error: 'Pedido desconhecido.' });
    }
}).listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
