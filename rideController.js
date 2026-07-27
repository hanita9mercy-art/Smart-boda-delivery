const express = require('express');
const router = express.Router();

// Import Controllers
// Since rideRoutes.js is in the root, use ./ to find rideController.js
const rideController = require('./rideController'); 
// paymentController is inside the 'controllers' folder, so use ./controllers/
const paymentController = require('./controllers/paymentController');

// Ride Routes
router.post('/create', rideController.createRide);
router.get('/available', rideController.getNearbyRides);
router.patch('/accept', rideController.acceptRide);
router.patch('/complete', rideController.completeRide);
router.patch('/cancel', rideController.cancelRide);

// Payment Routes
router.post('/initiate-payment', paymentController.initiatePayment);

module.exports = router;
