const { flw } = require('../services/paymentService');
const Ride = require('../models/rideModel'); // Ensure this path matches your file structure

// 1. Function to create the payment link
exports.initiatePayment = async (req, res) => {
    try {
        console.log("SENDING THIS TO FLUTTERWAVE:", req.body);

        const { email, name, phone, amount } = req.body;

        if (!email || !amount) {
            return res.status(400).json({ message: "Missing required payment details" });
        }

        const payload = {
            tx_ref: "tx-" + Date.now(), // Unique reference for each transaction
            amount: amount,
            currency: "UGX",
            redirect_url: "https://smart-boda-delivery.onrender.com/payment-success",
            customer: {
                email: email,
                name: name,
                phonenumber: phone
            },
            customizations: {
                title: "Smart Boda Delivery",
                description: "Ride Payment"
            }
        };

        const response = await flw.PaymentLink.create(payload);
        
        res.status(200).json({
            message: "Payment link created successfully",
            paymentLink: response.data.link
        });
    } catch (error) {
        console.error("Payment Error:", error);
        res.status(500).json({ message: "Failed to initiate payment" });
    }
};

// 2. Function to handle incoming Webhooks from Flutterwave
exports.handleWebhook = async (req, res) => {
    try {
        // Verify the signature to ensure it's from Flutterwave
        const secretHash = process.env.FLW_SECRET_HASH;
        const signature = req.headers["verif-hash"];

        if (!signature || signature !== secretHash) {
            console.error("Invalid Webhook Signature detected!");
            return res.status(401).send('Unauthorized');
        }

        const event = req.body;
        console.log("Flutterwave Webhook Received:", event);

        // Update the database if the payment is successful
        if (event.data.status === 'successful') {
            const txRef = event.data.tx_ref;

            // Make sure 'transactionId' matches your database schema
            const updatedRide = await Ride.findOneAndUpdate(
                { transactionId: txRef }, 
                { status: 'paid' }, 
                { new: true }
            );

            if (updatedRide) {
                console.log("Ride marked as paid in database:", updatedRide._id);
                
                // If using Socket.io, uncomment below to notify the client:
                // req.app.get('io').emit('paymentConfirmed', { rideId: updatedRide._id });
            } else {
                console.warn("Payment successful, but no ride found with ref:", txRef);
            }
        }

        // Always send 200 OK so Flutterwave stops retrying
        res.status(200).send('Webhook Received');
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send();
    }
};
