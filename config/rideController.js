// rideController.js - Real-Time PostGIS Order & Rider Matching
const db = require('./config/db');

// 1. Find Unlocked, Online Boda Riders Nearby (Within 2 km)
exports.getNearbyRiders = async (req, res) => {
  const { pickupLng, pickupLat } = req.query;

  if (!pickupLng || !pickupLat) {
    return res.status(400).json({ error: 'Pickup coordinates (pickupLng, pickupLat) are required.' });
  }

  try {
    // Spatial Query: ST_DWithin filters points within 2000m (2 km)
    const result = await db.query(
      `SELECT rider_id, full_name, phone_number, stage_name, wallet_balance,
              ST_Y(current_location::geometry) AS latitude,
              ST_X(current_location::geometry) AS longitude,
              ROUND(
                ST_Distance(
                  current_location::geography, 
                  ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                )::numeric, 0
              ) AS distance_meters
       FROM riders
       WHERE is_online = true 
         AND account_status = 'ACTIVE'
         AND wallet_balance > credit_limit -- Must be above the lockout threshold (-10,000 UGX)
         AND ST_DWithin(
               current_location::geography,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
               2000
             )
       ORDER BY distance_meters ASC
       LIMIT 10;`,
      [pickupLng, pickupLat]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      riders: result.rows
    });

  } catch (err) {
    console.error('Error fetching nearby riders:', err);
    res.status(500).json({ error: 'Could not fetch nearby riders.' });
  }
};

// 2. Rider Accepts an Order (Atomic Lock)
exports.acceptOrder = async (req, res) => {
  const { orderId, riderId } = req.body;

  try {
    // Atomically claim the order only if its status is still 'PENDING'
    const result = await db.query(
      `UPDATE orders 
       SET rider_id = $1, status = 'ACCEPTED' 
       WHERE order_id = $2 AND status = 'PENDING' 
       RETURNING order_id, status, rider_id`,
      [riderId, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Order already claimed by another rider or cancelled.' });
    }

    res.status(200).json({
      success: true,
      message: 'Order accepted successfully!',
      order: result.rows[0]
    });

  } catch (err) {
    console.error('Accept order error:', err);
    res.status(500).json({ error: 'Failed to accept order.' });
  }
};
