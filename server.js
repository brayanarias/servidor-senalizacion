import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Límites de salas
const ROOM_LIMITS = {
  auditorio: 100,
  oficina1: 5,
  oficina2: 5,
  // ... añade las 13 oficinas
};

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('join-room', (roomId, username) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size >= ROOM_LIMITS[roomId]) {
      socket.emit('room-full', '¡La sala está llena!');
      return;
    }

    socket.join(roomId);
    socket.to(roomId).emit('user-connected', { userId: socket.id, username });
    socket.emit('room-joined', roomId);
  });

  // WebRTC: Señales entre pares
  socket.on('offer', (data) => socket.to(data.target).emit('offer', data));
  socket.on('answer', (data) => socket.to(data.target).emit('answer', data));
  socket.on('ice-candidate', (data) => socket.to(data.target).emit('ice-candidate', data));

  socket.on('disconnect', () => {
    io.emit('user-disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
