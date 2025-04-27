const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = {};

wss.on('connection', (ws) => {
    const id = uuidv4();
    clients[id] = ws;

    console.log(`Nuevo cliente conectado: ${id}`);

    // Enviar el ID propio al cliente
    ws.send(JSON.stringify({ type: 'id', id }));

    // Avisar a todos los demás que llegó un nuevo usuario
    broadcast({ type: 'new-user', id }, id);

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
            const target = clients[data.to];
            if (target && target.readyState === WebSocket.OPEN) {
                target.send(JSON.stringify({ ...data, from: id }));
            }
        } else if (data.type === 'disconnect') {
            console.log(`Usuario ${id} solicitó desconexión`);
            cleanup(id);
        }
    });

    ws.on('close', () => {
        console.log(`Cliente desconectado: ${id}`);
        cleanup(id);
    });

    ws.on('error', (error) => {
        console.error(`Error en la conexión del cliente ${id}:`, error);
        cleanup(id);
    });
});

function broadcast(message, excludeId = null) {
    Object.keys(clients).forEach(clientId => {
        if (clientId !== excludeId && clients[clientId].readyState === WebSocket.OPEN) {
            clients[clientId].send(JSON.stringify(message));
        }
    });
}

function cleanup(id) {
    if (clients[id]) {
        delete clients[id];
        broadcast({ type: 'user-disconnected', id });
    }
}

app.get('/', (req, res) => {
    res.send('Servidor de señalización activo');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Servidor de señalización escuchando en puerto ${PORT}`);
});
