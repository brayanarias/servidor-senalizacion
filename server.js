const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = {};

const PORT = process.env.PORT || 3000;

wss.on('connection', (ws) => {
    const id = uuidv4();
    clients[id] = ws;
    ws.send(JSON.stringify({ type: 'id', id }));

    // Informar a los demás usuarios que un nuevo usuario se ha conectado
    for (const otherId in clients) {
        if (otherId !== id) {
            clients[otherId].send(JSON.stringify({ type: 'new-user', id }));
        }
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        // Si es un mensaje de señalización, reenviar al target
        if (data.to && clients[data.to]) {
            clients[data.to].send(JSON.stringify({ 
                type: data.type, 
                from: id, 
                ...(data.offer && { offer: data.offer }),
                ...(data.answer && { answer: data.answer }),
                ...(data.candidate && { candidate: data.candidate })
            }));
        }
    });

    ws.on('close', () => {
        delete clients[id];
    });
});

server.listen(PORT, () => {
    console.log(`Servidor de señalización escuchando en puerto ${PORT}`);
});
