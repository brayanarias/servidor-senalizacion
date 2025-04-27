const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // Importa UUID

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = {};

const PORT = process.env.PORT || 3000;

wss.on('connection', (ws) => {
    const id = uuidv4();
    clients[id] = ws;
    ws.send(JSON.stringify({ type: 'id', id }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const target = clients[data.target];
        if (target) {
            target.send(JSON.stringify({ type: 'signal', from: id, data: data.data }));
        }
    });

    ws.on('close', () => {
        delete clients[id];
    });
});

server.listen(PORT, () => {
    console.log(`Servidor de señalización escuchando en puerto ${PORT}`);
});
