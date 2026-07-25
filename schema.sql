-- schema.sql - Smart Boda Database Schema with PostGIS Support

-- Enable PostGIS spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. RIDERS TABLE
CREATE TABLE IF NOT EXISTS riders (
    rider_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    wallet_balance NUMERIC(12, 2) DEFAULT 0.00,
    credit_limit NUMERIC(12, 2) DEFAULT -10000.00,
    is_online BOOLEAN DEFAULT false,
    account_status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'LOCKED', 'SUSPENDED'
    current_location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. AGENTS TABLE (Stage Float Distributors)
CREATE TABLE IF NOT EXISTS agents (
    agent_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    wallet_balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    rider_id INT REFERENCES riders(rider_id),
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'ON_TRIP', 'COMPLETED', 'CANCELLED'
    pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
    dropoff_location GEOGRAPHY(POINT, 4326) NOT NULL,
    fare_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    amount_ugx NUMERIC(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'AGENT_FLOAT_TOPUP', 'RIDE_PAYMENT', 'PLATFORM_FEE'
    created_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast spatial queries (find nearby riders quickly)
CREATE INDEX IF NOT EXISTS idx_riders_location ON riders USING GIST(current_location);
