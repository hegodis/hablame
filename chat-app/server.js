const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e7 // Límite de 10MB para fotos/videos
});

app.use(express.static(path.join(__dirname, 'public')));

// Base de datos en memoria para usuarios online
const onlineUsers = new Map();

io.on('connection', (socket) => {
    // Registro de usuario
    socket.on('register-user', (data) => {
        onlineUsers.set(socket.id, {
            id: socket.id,
            phoneId: data.phoneId,
            username: data.username,
            avatar: data.avatar,
            color: data.color
        });
        // Enviar lista actualizada de usuarios
        io.emit('update-users', Array.from(onlineUsers.values()));
    });

    // Escuchar nuevos mensajes
    socket.on('send-message', (msgData) => {
        io.emit('broadcast-message', {
            id: msgData.id,
            senderId: socket.id,
            username: msgData.username,
            color: msgData.color,
            avatar: msgData.avatar,
            text: msgData.text,
            file: msgData.file, // Base64 de foto/video
            fileType: msgData.fileType,
            likes: 0
        });
    });

    // Eliminar mensaje propio
    socket.on('delete-message', (messageId) => {
        io.emit('message-deleted', messageId);
    });

    // Dar like a un comentario
    socket.on('like-message', (messageId) => {
        io.emit('message-liked', messageId);
    });

    // Al desconectarse: BORRADO AUTOMÁTICO de datos del usuario
    socket.on('disconnect', () => {
        if (onlineUsers.has(socket.id)) {
            onlineUsers.delete(socket.id);
            // Notificar a los demás y actualizar lista
            io.emit('update-users', Array.from(onlineUsers.values()));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
