const db = require('./db'); // Ensure this matches your file path

exports.createRide = async (req, res) => {
    try {
        const { customerId, pickupLocation, destination, packageDetails } = req.body;
        const query = 'INSERT INTO rides (customer_id, pickup_location, destination, package_details, status) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const values = [customerId, pickupLocation, destination, packageDetails, 'pending'];
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create ride" });
    }
};

exports.getNearbyRides = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM rides WHERE status = $1', ['pending']);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch rides" });
    }
};

exports.acceptRide = async (req, res) => {
    try {
        const { rideId, riderId } = req.body;
        const query = 'UPDATE rides SET status = $1, rider_id = $2 WHERE id = $3 RETURNING *';
        const result = await db.query(query, ['accepted', riderId, rideId]);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to accept ride" });
    }
};

exports.completeRide = async (req, res) => {
    try {
        const { rideId } = req.body;
        const result = await db.query('UPDATE rides SET status = $1 WHERE id = $2 RETURNING *', ['completed', rideId]);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to complete ride" });
    }
};

exports.cancelRide = async (req, res) => {
    try {
        const { rideId } = req.body;
        const result = await db.query('UPDATE rides SET status = $1 WHERE id = $2 RETURNING *', ['cancelled', rideId]);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to cancel ride" });
    }
};

// This export is what fixes your [object Undefined] error!
module.exports = {
    createRide: exports.createRide,
    getNearbyRides: exports.getNearbyRides,
    acceptRide: exports.acceptRide,
    completeRide: exports.completeRide,
    cancelRide: exports.cancelRide
};
