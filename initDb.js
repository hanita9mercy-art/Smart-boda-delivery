const { Client } = require('pg');

// This connects to your Render database
const client = new Client({
  connectionString: process.env.DATABASE_URL, // This uses the URL Render gives you
});

const createTable = async () => {
  try {
    await client.connect();
    console.log("Connected to database!");

    const query = `
      CREATE TABLE IF NOT EXISTS riders (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(15) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        photo_url TEXT,
        status VARCHAR(20) DEFAULT 'Resting',
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        wallet_balance INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(query);
    console.log("Table 'riders' is ready!");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await client.end();
  }
};

createTable();
