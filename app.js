// app.js - Safe-Mode Server Entry Point
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// This function stops the app from crashing if a file is missing
const safeRequire = (filePath) => {
    try {
        return require(filePath);
    } catch (e) {
        console.error(`⚠️ CRITICAL: Cannot find module ${filePath}`);
        return null;
    }
};

// Import Controllers using Safe-Mode
const authController = safeRequire('./authController');
const rideController = safeRequire('./rideController');
const walletController = safeRequire('./walletController');
const socketHandler = safeRequire('./socketHandler');
const db = safeRequire('./config/db');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.io (only if socketHandler was found)
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
if (socketHandler) socketHandler(io);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
    res.status(200).json({ status: 'OK', database: db ? 'Connected' : 'Disconnected' });
});

// Routes (only if controllers were found)
if (authController) {
    app.post('/api/v1/auth/rider-login', authController.riderLogin);
    app.post('/api/v1/auth/rider-register', authController.riderRegister);
}

if (rideController) {
    app.get('/api/v1/rides/nearby', rideController.getNearbyRides);
    app.get('/api/v1/rides/accept', rideController.acceptRide);
}

if (walletController) {
    app.post('/api/v1/wallet/transfer', walletController.transfer);
}

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}.`);
});
