// authController.js - Authentication & PIN Management
const db = require('./config/db');
const bcrypt = require('bcryptjs'); // Using the library you already have
const jwt = require('jsonwebtoken');

// 1. Rider Sign-In
exports.riderLogin = async (req, res) => {
    const { phoneNumber, pin } = req.body;
    try {
        const result = await db.query('SELECT * FROM riders WHERE phone_number = $1', [phoneNumber]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Rider account not found' });
        
        const rider = result.rows[0];
        const isPinValid = await bcrypt.compare(pin, rider.password_hash);
        if (!isPinValid) return res.status(401).json({ error: 'Invalid PIN' });

        const token = jwt.sign(
            { riderId: rider.id, phoneNumber: rider.phone_number },
            process.env.JWT_SECRET || 'smart_boda_secret_key',
            { expiresIn: '30d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            rider: {
                id: rider.id,
                fullName: rider.full_name,
                phoneNumber: rider.phone_number,
                walletBalance: rider.wallet_balance,
                status: rider.status
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// 2. NEW: Rider Registration
exports.riderRegister = async (req, res) => {
    const { full_name, phone_number, pin } = req.body;
    try {
        const hashedPin = await bcrypt.hash(pin, 10);
        const query = `
            INSERT INTO riders (full_name, phone_number, password_hash) 
            VALUES ($1, $2, $3)
            RETURNING id;
        `;
        await db.query(query, [full_name, phone_number, hashedPin]);
        res.status(201).json({ message: "Rider registered successfully!" });
    } catch (err) {
        console.error("Registration error:", err);
        if (err.code === '23505') return res.status(400).json({ error: "Phone number already exists" });
        res.status(500).json({ error: "Registration failed" });
    }
};
