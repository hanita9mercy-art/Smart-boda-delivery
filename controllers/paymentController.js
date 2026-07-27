const express = require('express');
const router = express.Router();

// Import Controllers
// '..' goes up to the root folder where rideController.js lives
const rideController = require('../rideController'); 
// '.' stays in the current folder for paymentController.js
const paymentController = require('./paymentController');

// Ride Routes
router.post('/create', rideController.createRide);
router.get('/available', rideController.getNearbyRides);
router.patch('/accept', rideController.acceptRide);
router.patch('/complete', rideController.completeRide);
router.patch('/cancel', rideController.cancelRide);

// Payment Routes
router.post('/initiate-payment', paymentController.initiatePayment);

module.exports = router;
