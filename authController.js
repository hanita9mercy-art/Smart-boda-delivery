const bcrypt = require('bcryptjs');
const db = require('./db'); 

exports.riderRegister = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, role } = req.body;

        // 1. Basic Validation
        if (!firstName || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Database Insertion
        const query = `
            INSERT INTO riders (first_name, last_name, email, phone, password, role) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id;
        `;
        const values = [firstName, lastName, email, phone, hashedPassword, role];
        
        const result = await db.query(query, values);

        // 4. Success Response
        res.status(201).json({ 
            message: "Rider registered successfully!",
            riderId: result.rows[0].id 
        });
        
    } catch (error) {
        console.error("Registration Error:", error);
        
        // 5. Handle unique constraint errors (e.g., email already exists)
        if (error.code === '23505') {
            return res.status(409).json({ message: "Email or phone already registered" });
        }
        
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};
