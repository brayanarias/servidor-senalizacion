const express = require('express');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8080;

// Servidor HTTP para mantener vivo el proceso en Railway
app.get('/', (req, res) => {
    res.send('Servidor de señalización activo');
});

const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});

// WebSocket Server
const wss = new WebSocketServer({ server });

const clients = new Map(); // Guardamos clientes conectados y sus IDs

wss.on('connection', (ws) => {
    const id = uuidv4(); // Generar ID único
    clients.set(ws, id);

    // Enviar su propio ID al usuario conectado
    ws.send(JSON.stringify({ type: 'id', id }));

    console.log(`Usuario conectado: ${id}`);

    // Cuando un usuario se conecta, avisar a todos los demás
    for (let [client, clientId] of clients.entries()) {
        if (client !== ws && client.readyState === 1) { // 1 = OPEN
            client.send(JSON.stringify({ type: 'new-user', id }));
        }
    }

    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (error) {
            console.error('Error al parsear el mensaje:', error);
            return;
        }

        // Redirigir ofertas, respuestas y candidatos
        if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
            for (let [client, clientId] of clients.entries()) {
                if (clientId === data.to && client.readyState === 1) {
                    client.send(JSON.stringify({ ...data, from: clients.get(ws) }));
                }
            }
        }
    });

    ws.on('close', () => {
        console.log(`Usuario desconectado: ${clients.get(ws)}`);
        clients.delete(ws);
    });
});
