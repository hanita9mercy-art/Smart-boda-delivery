// walletController.js - Secure Float & Wallet Management
const db = require('./config/db');

// 1. Agent Transfers Float to Rider (Stage Cash Top-Up)
exports.transferFloatToRider = async (req, res) => {
  const { agentId, riderPhoneNumber, amountUGX } = req.body;

  if (amountUGX <= 0) {
    return res.status(400).json({ error: 'Invalid transfer amount.' });
  }

  // Use a Database Client for Atomic Transactions
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN'); // Lock operations

    // Check if Agent has enough balance
    const agentRes = await client.query(
      'SELECT wallet_balance FROM agents WHERE agent_id = $1 FOR UPDATE',
      [agentId]
    );

    if (agentRes.rows.length === 0 || agentRes.rows[0].wallet_balance < amountUGX) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient Agent float balance.' });
    }

    // Deduct float from Agent
    await client.query(
      'UPDATE agents SET wallet_balance = wallet_balance - $1 WHERE agent_id = $2',
      [amountUGX, agentId]
    );

    // Credit float to Rider wallet
    const riderRes = await client.query(
      `UPDATE riders 
       SET wallet_balance = wallet_balance + $1 
       WHERE phone_number = $2 
       RETURNING rider_id, full_name, wallet_balance`,
      [amountUGX, riderPhoneNumber]
    );

    if (riderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Rider phone number not found.' });
    }

    // Log the transaction history
    await client.query(
      `INSERT INTO transactions (sender_id, receiver_id, amount_ugx, type) 
       VALUES ($1, $2, $3, 'AGENT_FLOAT_TOPUP')`,
      [agentId, riderRes.rows[0].rider_id, amountUGX]
    );

    await client.query('COMMIT'); // Commit changes safely

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${amountUGX} UGX to ${riderRes.rows[0].full_name}`,
      newRiderBalance: riderRes.rows[0].wallet_balance
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Float transfer error:', err);
    res.status(500).json({ error: 'Transaction failed. Please try again.' });
  } finally {
    client.release();
  }
};
