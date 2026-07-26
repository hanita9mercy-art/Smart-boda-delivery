module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected: ' + socket.id);

        // 1. Customer joins a specific "ride room" to track the Boda
        socket.on('joinRide', (rideId) => {
            socket.join(`ride_${rideId}`);
            console.log(`Socket ${socket.id} joined room: ride_${rideId}`);
        });

        // 2. Rider sends their location
        socket.on('sendLocation', (data) => {
            // data format: { rideId: '123', latitude: 0.123, longitude: 32.123 }
            const { rideId, latitude, longitude } = data;
            
            // Send this location to everyone in that specific ride's room
            io.to(`ride_${rideId}`).emit('locationUpdated', { 
                rideId, 
                latitude, 
                longitude 
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};
