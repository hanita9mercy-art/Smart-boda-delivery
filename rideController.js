const db = require('./config/db');

exports.getNearbyRiders = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM riders WHERE status = $1', ['available']);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch riders' });
    }
};

exports.acceptOrder = async (req, res) => {
    const { orderId, riderId } = req.body;
    try {
        await db.query('UPDATE orders SET status = $1, rider_id = $2 WHERE id = $3', ['accepted', riderId, orderId]);
        res.status(200).json({ success: true, message: 'Order accepted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to accept order' });
    }
};
