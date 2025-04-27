const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // Importamos para crear IDs únicos

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

const clients = {}; // Guardamos los clientes conectados

wss.on('connection', (ws) => {
    const id = uuidv4(); // Generamos un ID único
    clients[id] = ws;
    console.log(`Nuevo cliente conectado: ${id}`);

    // Apenas se conecta, enviamos su ID
    ws.send(JSON.stringify({ type: 'welcome', id }));

    // Cuando recibe un mensaje
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // Si quiere llamar a otro
        if (data.type === 'call') {
            const target = clients[data.target];
            if (target) {
                target.send(JSON.stringify({
                    type: 'incoming-call',
                    from: id,
                    offer: data.offer
                }));
            }
        }

        // Si responde a la llamada
        if (data.type === 'answer') {
            const target = clients[data.target];
            if (target) {
                target.send(JSON.stringify({
                    type: 'call-answered',
                    from: id,
                    answer: data.answer
                }));
            }
        }

        // Si envía candidatos ICE
        if (data.type === 'ice-candidate') {
            const target = clients[data.target];
            if (target) {
                target.send(JSON.stringify({
                    type: 'ice-candidate',
                    from: id,
                    candidate: data.candidate
                }));
            }
        }
    });

    ws.on('close', () => {
        console.log(`Cliente desconectado: ${id}`);
        delete clients[id];
    });
});

server.listen(PORT, () => {
    console.log(`Servidor de señalización escuchando en puerto ${PORT}`);
});
