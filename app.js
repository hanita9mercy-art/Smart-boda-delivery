
// app.js - Clean Server Entry Point
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Route & DB Imports
const authController = require('./authController');
const rideController = require('./rideController');
const walletController = require('./walletController');
const socketHandler = require('./socketHandler');
const db = require('./config/db'); 

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
socketHandler(io);

// API Routes
app.get('/', (req, res) => {
    res.status(200).json({ status: 'Active', service: 'Smart Boda Delivery API', region: 'Uganda' });
});

app.post('/api/v1/auth/rider-login', authController.riderLogin);
app.get('/api/v1/rides/nearby', rideController.getNearbyRiders);
app.post('/api/v1/rides/accept', rideController.acceptOrder);
app.post('/api/v1/wallet/transfer-float', walletController.transferFloatToRider);

// Temporary Init Route (Run once, then delete!)
app.get('/init-db', async (req, res) => {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await db.query(schema);
        res.status(200).send('Database tables created successfully!');
    } catch (err) {
        res.status(500).send('Error creating tables: ' + err.message);
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Smart Boda Backend running on port ${PORT}`);
});
