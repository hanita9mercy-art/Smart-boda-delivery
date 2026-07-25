// app.js - Complete Server Entry Point with WebSockets & Routes
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

// Route Controllers
const authController = require('./authController');
const rideController = require('./rideController');
const walletController = require('./walletController');
const socketHandler = require('./socketHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Attach Socket logic
socketHandler(io);

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'Active', 
    service: 'Smart Boda Delivery API', 
    region: 'Uganda' 
  });
});

// --- API ROUTES ---

// Auth
app.post('/api/v1/auth/rider-login', authController.riderLogin);

// Rides & Nearby Search
app.get('/api/v1/rides/nearby', rideController.getNearbyRiders);
app.post('/api/v1/rides/accept', rideController.acceptOrder);

// Wallet & Float Transfers
app.post('/api/v1/wallet/transfer-float', walletController.transferFloatToRider);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Smart Boda Backend server running on port ${PORT}`);
});
