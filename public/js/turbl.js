
const socket = io().connect('http://localhost:3000');

const startButton = document.querySelector('#btn-start');

socket.on('connection', (socket) => {
    console.log('A user just connected.');
});

socket.on('disconnect', () => {
    console.log('A user has disconnected.');
});

socket.on('reconnect', () => {
    console.log('A user has reconnected.');
});


socket.on('startGame', () => {
    startButton.style.display = 'none';
    console.log('received: startGame');
});

startButton.addEventListener('click', () => {
    socket.emit('startGame');
    console.log('emitted: startGame');
});

// TODO switch to typescript

