// socketHandler.js - Real-Time Socket.io GPS Location Streaming
const db = require('./config/db');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // 1. Join Order Room (Customer or Rider)
    socket.on('join_order_room', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined room: order_${orderId}`);
    });

    // 2. Rider Streams Live GPS Coordinates
    socket.on('update_rider_location', async (data) => {
      const { riderId, orderId, latitude, longitude } = data;

      try {
        // Broadcast location instantly to the customer listening in this order's room
        io.to(`order_${orderId}`).emit('rider_location_updated', {
          riderId,
          latitude,
          longitude,
          timestamp: new Date()
        });

        // Async update PostGIS current_location in database
        await db.query(
          `UPDATE riders 
           SET current_location = ST_SetSRID(ST_MakePoint($1, $2), 4326) 
           WHERE rider_id = $3`,
          [longitude, latitude, riderId]
        );

      } catch (err) {
        console.error('Socket GPS update error:', err);
      }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};
