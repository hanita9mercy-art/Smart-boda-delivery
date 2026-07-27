const express = require('express');
const router = express.Router();

// Import Controllers
// rideController is in the root folder, so we require it directly
const rideController = require('./rideController');
// paymentController is inside the 'controllers' folder, so we keep that path
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
