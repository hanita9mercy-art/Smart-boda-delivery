const express = require('express');
const router = express.Router();

// Import Controllers
// Changed paths from '../' to './' to look inside the src folder
const rideController = require('./controllers/rideController');
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
