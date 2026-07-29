const Flutterwave = require('flutterwave-node-v3');
const Ride = require('../rideModel');

// Initialize Flutterwave directly here (No need for paymentService.js)
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

exports.initiatePayment = async (req, res) => {
    try {
        const { email, name, phone, amount } = req.body;
        if (!email || !amount) return res.status(400).json({ message: "Missing details" });

        const payload = {
            tx_ref: "tx-" + Date.now(),
            amount: amount,
            currency: "UGX",
            redirect_url: "https://smart-boda-delivery.onrender.com/payment-success",
            customer: { email, name, phonenumber: phone },
            customizations: { title: "Smart Boda Delivery", description: "Ride Payment" }
        };

        const response = await flw.PaymentLink.create(payload);
        res.status(200).json({ paymentLink: response.data.link });
    } catch (error) {
        console.error("Payment Error:", error);
        res.status(500).json({ message: "Failed to initiate payment" });
    }
};

exports.handleWebhook = async (req, res) => {
    try {
        const secretHash = process.env.FLW_SECRET_HASH;
        if (req.headers["verif-hash"] !== secretHash) return res.status(401).send('Unauthorized');

        if (req.body.data.status === 'successful') {
            await Ride.findOneAndUpdate({ transactionId: req.body.data.tx_ref }, { status: 'paid' });
        }
        res.status(200).send('Webhook Received');
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send();
    }
};
