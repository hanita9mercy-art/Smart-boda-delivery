// walletController.js - Unified Float, Wallet, Pricing, & Reset
const db = require('./config/db');

// --- 1. PACKAGE & PRICING HELPER LOGIC ---
const TIER_PRICES = { SMALL: 5000, MEDIUM: 8000, LARGE: 15000 };

const determinePackageSize = (length, width, height, weight) => {
  const volume = length * width * height;
  if (weight > 15 || volume > 20000) return 'LARGE';
  if (weight > 5 || volume > 5000) return 'MEDIUM';
  return 'SMALL';
};

const calculateDeliveryFee = (size, distanceKm) => {
  const baseRate = TIER_PRICES[size.toUpperCase()] || TIER_PRICES.SMALL;
  const ratePerKm = 500;
  return baseRate + (distanceKm * ratePerKm);
};

// --- 2. FLOAT & WALLET OPERATIONS ---

// Agent Transfer to Rider
exports.transferFloatToRider = async (req, res) => {
  const { agentId, riderPhoneNumber, amountUGX } = req.body;
  if (amountUGX <= 0) return res.status(400).json({ error: 'Invalid amount.' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const agentRes = await client.query('SELECT wallet_balance FROM agents WHERE agent_id = $1 FOR UPDATE', [agentId]);
    if (agentRes.rows.length === 0 || agentRes.rows[0].wallet_balance < amountUGX) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient Agent float balance.' });
    }

    await client.query('UPDATE agents SET wallet_balance = wallet_balance - $1 WHERE agent_id = $2', [amountUGX, agentId]);
    const riderRes = await client.query(
      `UPDATE riders SET wallet_balance = wallet_balance + $1 WHERE phone_number = $2 RETURNING rider_id, wallet_balance`,
      [amountUGX, riderPhoneNumber]
    );

    if (riderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Rider phone number not found.' });
    }

    await client.query(`INSERT INTO transactions (sender_id, receiver_id, amount_ugx, type) VALUES ($1, $2, $3, 'AGENT_FLOAT_TOPUP')`, 
      [agentId, riderRes.rows[0].rider_id, amountUGX]);

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: `Transferred ${amountUGX} UGX`, newRiderBalance: riderRes.rows[0].wallet_balance });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Transaction failed.' });
  } finally {
    client.release();
  }
};

// Get Rider Balance
exports.getRiderBalance = async (req, res) => {
  const { riderId } = req.params;
  try {
    const result = await db.pool.query('SELECT wallet_balance FROM riders WHERE rider_id = $1', [riderId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rider not found.' });
    res.status(200).json({ success: true, balanceUGX: result.rows[0].wallet_balance });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// Rider Cash Out to Agent
exports.riderCashOut = async (req, res) => {
  const { riderId, agentId, amountUGX } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const riderRes = await client.query('SELECT wallet_balance FROM riders WHERE rider_id = $1 FOR UPDATE', [riderId]);
    if (riderRes.rows.length === 0 || riderRes.rows[0].wallet_balance < amountUGX) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient rider balance.' });
    }
    await client.query('UPDATE riders SET wallet_balance = wallet_balance - $1 WHERE rider_id = $2', [amountUGX, riderId]);
    await client.query('UPDATE agents SET wallet_balance = wallet_balance + $1 WHERE agent_id = $2', [amountUGX, agentId]);
    await client.query(`INSERT INTO transactions (sender_id, receiver_id, amount_ugx, type) VALUES ($1, $2, $3, 'RIDER_CASH_OUT')`, 
      [riderId, agentId, amountUGX]);
    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'Cash out successful.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Transaction failed.' });
  } finally {
    client.release();
  }
};

// --- 3. PRICING & CLEAN SHEET ENDPOINTS ---

exports.calculatePrice = (req, res) => {
  const { length, width, height, weight, distance } = req.body;
  const size = determinePackageSize(length, width, height, weight);
  const price = calculateDeliveryFee(size, distance);
  res.status(200).json({ success: true, packageSize: size, estimatedPrice: price });
};

exports.resetSystem = async (req, res) => {
  // Security Check: Only allow if the header 'x-admin-key' matches your secret
  const secretKey = req.headers['x-admin-key'];
  if (secretKey !== 'MY_SECRET_RESET_KEY') {
    return res.status(403).json({ error: 'Unauthorized: Access Denied' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE transactions RESTART IDENTITY');
    await client.query('UPDATE agents SET wallet_balance = 0');
    await client.query('UPDATE riders SET wallet_balance = 0');
    await client.query('COMMIT');
    res.status(200).json({ success: true, message: "System reset to clean sheet." });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Reset failed.' });
  } finally {
    client.release();
  }
};
