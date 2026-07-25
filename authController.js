// authController.js - Authentication & PIN Management
const db = require('./config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. Rider Sign-In with Phone + 4-Digit PIN
exports.riderLogin = async (req, res) => {
  const { phoneNumber, pin } = req.body;

  try {
    // Look up rider by phone number
    const result = await db.query(
      'SELECT * FROM riders WHERE phone_number = $1',
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rider account not found.' });
    }

    const rider = result.rows[0];

    // Verify 4-digit PIN against stored hash
    const isPinValid = await bcrypt.compare(pin, rider.pin_hash);
    if (!isPinValid) {
      return res.status(401).json({ error: 'Invalid PIN.' });
    }

    // Check Wallet Threshold (-10,000 UGX lockout rule)
    const isLockedOut = parseFloat(rider.wallet_balance) < parseFloat(rider.credit_limit);

    // Generate JWT Token for session authorization
    const token = jwt.sign(
      { riderId: rider.rider_id, phoneNumber: rider.phone_number },
      process.env.JWT_SECRET || 'smart_boda_secret_key',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      rider: {
        id: rider.rider_id,
        fullName: rider.full_name,
        phoneNumber: rider.phone_number,
        stageName: rider.stage_name,
        walletBalance: rider.wallet_balance,
        isLockedOut: isLockedOut, // Tells the mobile app to show Pay-To-Unlock screen
        status: rider.account_status
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
};
