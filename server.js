const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

const usuarios = {};

app.use(express.static(path.join(__dirname, '/')));

io.on('connection', socket => {
    usuarios[socket.id] = socket.id;
    socket.emit('usuarios', Object.keys(usuarios));
    socket.broadcast.emit('usuarios', [socket.id]);

    socket.on('nuevo-usuario', () => {
        socket.broadcast.emit('usuarios', [socket.id]);
    });

    socket.on('offer', data => {
        io.to(data.to).emit('offer', { from: socket.id, offer: data.offer });
    });

    socket.on('answer', data => {
        io.to(data.to).emit('answer', { from: socket.id, answer: data.answer });
    });

    socket.on('candidate', data => {
        io.to(data.to).emit('candidate', { from: socket.id, candidate: data.candidate });
    });

    socket.on('disconnect', () => {
        delete usuarios[socket.id];
        socket.broadcast.emit('usuario-desconectado', socket.id);
    });
});

http.listen(3000, () => {
    console.log('Servidor corriendo en puerto 3000');
});
