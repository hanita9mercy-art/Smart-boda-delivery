const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

// Safe import helper
const safeRequire = (path) => {
    try { return require(path); }
    catch (e) { console.error(`Failed to load ${path}:`, e.message); }
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

// --- ROUTES ---
if (authController) {
    app.post('/api/v1/auth/rider-register', authController.riderRegister);
    if (authController.riderLogin) app.post('/rider-login', authController.riderLogin);
}

if (rideController) {
    if (rideController.getNearbyRides) app.get('/get-nearby-rides', rideController.getNearbyRides);
    if (rideController.acceptRide) app.post('/accept-ride', rideController.acceptRide);
}

if (walletController) {
    if (walletController.transfer) app.post('/transfer', walletController.transfer);
}

// Socket.io
const io = new Server(server, { cors: { origin: "*" } });
if (socketHandler) socketHandler(io);

// Server Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
