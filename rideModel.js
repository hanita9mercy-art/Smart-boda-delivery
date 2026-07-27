const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  transactionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  status: { 
    type: String, 
    default: 'pending' 
  },
  // Add other fields like customer/driver info here if needed
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Ride', rideSchema);
