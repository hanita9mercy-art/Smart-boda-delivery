const db = require('./db');

exports.getNearbyRides = async (req, res) => {
  try {
    // Logic to fetch rides
    const result = await db.query('SELECT * FROM rides WHERE status = $1', ['available']);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ message: "Failed to fetch rides" });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    // Logic to accept a ride
    const { rideId, riderId } = req.body;
    await db.query('UPDATE rides SET status = $1, rider_id = $2 WHERE id = $3', ['accepted', riderId, rideId]);
    res.status(200).json({ message: "Ride accepted successfully" });
  } catch (error) {
    console.error("Error accepting ride:", error);
    res.status(500).json({ message: "Failed to accept ride" });
  }
};
