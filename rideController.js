const db = require('./config/db');

// --- Helper: Pricing Logic (Rate per KM set to 400) ---
const calculateFee = (distanceKM, pickupLocation) => {
  const BASE_FARE = 2000; 
  const RATE_PER_KM = 400; // Updated to 400 per km
  const MINIMUM_FARE = 3000;
  
  // List of town areas that trigger the 10% traffic premium
  const townAreas = ['KAMPALA_CENTRAL', 'PARLIAMENT', 'OLD_TAXI_PARK', 'NAKASERO'];
  const isTownPickup = pickupLocation && townAreas.includes(pickupLocation.toUpperCase());
  const trafficMultiplier = isTownPickup ? 1.1 : 1.0;

  const total = (BASE_FARE + (distanceKM * RATE_PER_KM)) * trafficMultiplier;
  
  // Round to nearest 500 for professional pricing
  const finalPrice = Math.round(total / 500) * 500;

  return Math.max(finalPrice, MINIMUM_FARE);
};

// --- Controller Actions ---

// 1. Create a new ride request
exports.createRide = async (req, res) => {
  const { customer_id, pickup_location, dropoff_location, distance_km } = req.body;
  try {
    const totalFee = calculateFee(distance_km, pickup_location);
    const query = `
      INSERT INTO rides (customer_id, pickup_location, dropoff_location, distance_km, total_fee_ugx, status)
      VALUES ($1, $2, $3, $4, $5, 'PENDING')
      RETURNING ride_id, total_fee_ugx;
    `;
    const values = [customer_id, pickup_location, dropoff_location, distance_km, totalFee];
    const result = await db.pool.query(query, values);

    res.status(201).json({ success: true, message: 'Ride requested', ride: result.rows[0] });
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
    res.status(500).json({ message: "Failed to fetch rides" });
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
    res.status(500).json({ message: "Failed to accept ride" });
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
