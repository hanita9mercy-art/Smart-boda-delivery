// app.js - Optimized & Stable Entry Point
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

// Safe import helper
const safeRequire = (path) => {
    try { return require(path); } 
    catch (e) { console.error(`Failed to load: ${path}`); return null; }
};

const app = express();
const server = http.createServer(app);

// Controllers
const authController = safeRequire('./authController');
const rideController = safeRequire('./rideController');
const walletController = safeRequire('./walletController');
const socketHandler = safeRequire('./socketHandler');

// Middleware
app.use(cors());
app.use(express.json());

// Routes - Safely add only if the function exists
if (authController) {
    if (authController.riderLogin) app.post('/api/v1/auth/rider-login', authController.riderLogin);
    if (authController.riderRegister) app.post('/api/v1/auth/rider-register', authController.riderRegister);
}

if (rideController) {
    if (rideController.getNearbyRides) app.get('/api/v1/rides/nearby', rideController.getNearbyRides);
    if (rideController.acceptRide) app.get('/api/v1/rides/accept', rideController.acceptRide);
}

if (walletController) {
    if (walletController.transfer) app.post('/api/v1/wallet/transfer', walletController.transfer);
}

// Socket.io
const io = new Server(server, { cors: { origin: '*' } });
if (socketHandler) socketHandler(io);

// Server Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server live on port ${PORT}`));
