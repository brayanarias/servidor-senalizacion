const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

let clients = {}; // Para guardar los clientes conectados

wss.on('connection', (ws) => {
    const id = uuidv4();
    clients[id] = ws;

    console.log(`Nuevo cliente conectado: ${id}`);

    // Enviar el propio ID al cliente
    ws.send(JSON.stringify({ type: 'id', id }));

    // Avisar a los demás que hay un nuevo usuario
    broadcast({ type: 'new-user', id }, id);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.to && clients[data.to]) {
                clients[data.to].send(JSON.stringify({ ...data, from: id }));
            }
        } catch (error) {
            console.error('Error al procesar mensaje:', error);
        }
    });

    ws.on('close', () => {
        console.log(`Cliente desconectado: ${id}`);
        delete clients[id];

        // Avisar a los demás que este cliente se desconectó
        broadcast({ type: 'user-disconnected', id });
    });
});

function broadcast(message, excludeId = null) {
    const data = JSON.stringify(message);
    Object.keys(clients).forEach(clientId => {
        if (clientId !== excludeId) {
            clients[clientId].send(data);
        }
    });
}

server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
