require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// Controllers
const authController = require('./authController');
const walletController = require('./walletController');
const socketHandler = require('./socketHandler');
const rideRoutes = require('./rideRoutes'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Authentication Routes
app.post('/api/v1/auth/rider-register', authController.riderRegister);
app.post('/rider-login', authController.riderLogin);

// Ride Routes
app.use('/api/rides', rideRoutes);

// Wallet Routes
app.get('/api/rider/balance/:riderId', walletController.getRiderBalance);
app.post('/api/rider/cash-out', walletController.riderCashOut);
app.post('/api/agent/transfer-float', walletController.transferFloatToRider);

// Pricing & Admin Routes
app.post('/api/rider/calculate-price', walletController.calculatePrice);
app.post('/api/admin/reset-system', walletController.resetSystem);

// Initialize Socket.io
socketHandler(io);

// Server Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
