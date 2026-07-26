const express = require('express');
const router = express.Router();
const rideController = require('./rideController');

// Routes mapping
router.post('/create', rideController.createRide);
router.get('/available', rideController.getNearbyRides);
router.patch('/accept', rideController.acceptRide);
router.patch('/complete', rideController.completeRide);
router.patch('/cancel', rideController.cancelRide);

module.exports = router;
