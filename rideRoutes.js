const express = require('express');
const router = express.Router();

const rideController = require('./rideController'); 
const paymentController = require('./controllers/paymentController');

// Ride Routes
router.post('/create', rideController.createRide);
router.get('/available', rideController.getNearbyRides);
router.patch('/accept', rideController.acceptRide);
router.patch('/complete', rideController.completeRide);
router.patch('/cancel', rideController.cancelRide);

// Payment Routes
router.post('/initiate-payment', paymentController.initiatePayment);

// Webhook Route
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
