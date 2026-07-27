const db = require('./config/db');

// --- Helper: Pricing Logic ---
const calculateFee = (distanceKM, pickupLocation) => {
  const BASE_FARE = 2000; 
  const RATE_PER_KM = 400; 
  const MINIMUM_FARE = 3000;
  
  const townAreas = ['KAMPALA_CENTRAL', 'PARLIAMENT', 'OLD_TAXI_PARK', 'NAKASERO'];
  const isTownPickup = pickupLocation && townAreas.includes(pickupLocation.toUpperCase());
  const trafficMultiplier = isTownPickup ? 1.1 : 1.0;

  const total = (BASE_FARE + (distanceKM * RATE_PER_KM)) * trafficMultiplier;
  const finalPrice = Math.round(total / 500) * 500;

  return Math.max(finalPrice, MINIMUM_FARE);
};

// --- Controller Actions ---

// 1. Create a new ride request & notify drivers via Socket.io
exports.createRide = async (req, res) => {
  const { customer_id, pickup_location, dropoff_location, distance_km } = req.body;
  
  try {
    const totalFee = calculateFee(distance_km, pickup_location);
    const query = `
      INSERT INTO rides (customer_id, pickup_location, dropoff_location, distance_km, total_fee_ugx, status)
      VALUES ($1, $2, $3, $4, $5, 'PENDING')
      RETURNING ride_id, total_fee_ugx, pickup_location, dropoff_location;
    `;
    const values = [customer_id, pickup_location, dropoff_location, distance_km, totalFee];
    const result = await db.pool.query(query, values);
    
    const newRide = result.rows[0];

    // Emit real-time update to all connected drivers
    req.io.emit('new_ride_request', {
      message: 'A new ride request is available!',
      ride: newRide
    });

    res.status(201).json({ 
      success: true, 
      message: 'Ride requested successfully', 
      ride: newRide 
    });
  } catch (err) {
    console.error('Error creating ride:', err);
    res.status(500).json({ success: false, message: 'Failed to create ride.' });
  }
};

// 2. Get list of available (pending) rides
exports.getNearbyRides = async (req, res) => {
  try {
    const result = await db.pool.query("SELECT * FROM rides WHERE status = 'PENDING'");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ success: false, message: "Failed to fetch rides" });
  }
};

// 3. Accept a ride
exports.acceptRide = async (req, res) => {
  try {
    const { rideId, riderId } = req.body;
    await db.pool.query(
      "UPDATE rides SET status = 'ACCEPTED', rider_id = $1 WHERE ride_id = $2", 
      [riderId, rideId]
    );
    res.status(200).json({ success: true, message: "Ride accepted successfully" });
  } catch (error) {
    console.error("Error accepting ride:", error);
    res.status(500).json({ success: false, message: "Failed to accept ride" });
  }
};

// 4. Complete a ride
exports.completeRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    await db.pool.query(
      "UPDATE rides SET status = 'COMPLETED' WHERE ride_id = $1",
      [rideId]
    );
    res.status(200).json({ success: true, message: "Ride completed successfully" });
  } catch (error) {
    console.error("Error completing ride:", error);
    res.status(500).json({ success: false, message: "Failed to complete ride" });
  }
};

// 5. Cancel a ride
exports.cancelRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    await db.pool.query(
      "UPDATE rides SET status = 'CANCELLED' WHERE ride_id = $1",
      [rideId]
    );
    res.status(200).json({ success: true, message: "Ride cancelled" });
  } catch (error) {
    console.error("Error cancelling ride:", error);
    res.status(500).json({ success: false, message: "Failed to cancel ride" });
  }
};
