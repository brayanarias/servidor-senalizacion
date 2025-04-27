const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');  // Asegúrate de tener instalada esta librería

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();  // Guardar clientes conectados y sus IDs

const PORT = process.env.PORT || 3000;

wss.on('connection', (ws) => {
  const id = uuidv4();  // Generar un ID único
  clients.set(id, ws);

  console.log(`Nuevo cliente conectado con ID: ${id}`);

  // Enviar el ID al cliente conectado
  ws.send(JSON.stringify({ type: 'your-id', id }));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error('Mensaje no es JSON válido:', message);
      return;
    }

    const { type, to, offer, answer, candidate } = data;

    // Redirigir la señalización
    if (to && clients.has(to)) {
      const recipient = clients.get(to);
      recipient.send(JSON.stringify({
        type,
        from: id,
        offer,
        answer,
        candidate
      }));
    }
  });

  ws.on('close', () => {
    clients.delete(id);
    console.log(`Cliente con ID ${id} desconectado`);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor de señalización escuchando en puerto ${PORT}`);
});
