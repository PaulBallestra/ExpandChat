console.log('chatjss');

const socket = io()

socket.on('chat', (data) => {
    alert('QQ est arrivé' + data)
});