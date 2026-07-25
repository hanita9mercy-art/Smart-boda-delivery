// app.js - Main Server Entry Point
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'Active', 
    service: 'Smart Boda Delivery API', 
    region: 'Uganda' 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Smart Boda Backend running on port ${PORT}`);
});
