console.log("DEBUG: app.js is starting...");

const express = require('express');
const app = express();
const rideRoutes = require('./rideRoutes'); // This connects your routes

app.use(express.json());

// Add Debug log to see if routes load
console.log("DEBUG: Loading routes...");
app.use('/rides', rideRoutes); 

const PORT = process.env.PORT || 3000;

// Centralized error handling
process.on('uncaughtException', (err) => {
    console.error("FATAL ERROR: Uncaught Exception:", err);
    process.exit(1);
});

app.listen(PORT, () => {
    console.log(`DEBUG: Server is running on port ${PORT}`);
});
