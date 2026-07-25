module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected: ' + socket.id);

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });

        // Add more socket events here as your app grows
    });
};
