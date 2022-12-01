// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 3000;

server.listen(port, () => {
    console.log(`Turbl Game Server is up on port ${port}.`);
});

// Serve
app.use(express.static(path.join(__dirname, '/../public')));

io.on('connection', (socket) => {
    console.log('A user just connected.');
    io.emit('connection');

    socket.on('disconnect', () => {
        console.log('A user has disconnected.');
    });

    socket.on('startGame', () => {
        console.log('received: startGame');
        io.emit('startGame');
    });
});
