const Flutterwave = require('flutterwave-node-v3');

// This uses the keys you added to your Render Environment variables
const flw = new Flutterwave(
    process.env.FLW_PUBLIC_KEY, 
    process.env.FLW_SECRET_KEY
);

module.exports = { flw };
