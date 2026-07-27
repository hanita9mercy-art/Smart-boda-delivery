const { flw } = require('../services/paymentService');

// Existing function
exports.initiatePayment = async (req, res) => {
    try {
        console.log("SENDING THIS TO FLUTTERWAVE:", req.body);
        const { email, name, phone, amount } = req.body;

        if (!email || !amount) {
            return res.status(400).json({ message: "Missing required payment details" });
        }

        const payload = {
            tx_ref: "tx-" + Date.now(),
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

// --- ADD THIS NEW FUNCTION BELOW ---
exports.handleWebhook = async (req, res) => {
    try {
        // Verify the signature from Flutterwave
        const secretHash = process.env.FLW_SECRET_HASH;
        const signature = req.headers["verif-hash"];

        if (!signature || signature !== secretHash) {
            console.error("Invalid Webhook Signature");
            return res.status(401).send();
        }

        const event = req.body;
        console.log("Flutterwave Webhook Received:", event);

        // Here you would add logic to update your database 
        // e.g., if (event.status === 'successful') { ... }

        res.status(200).send('Webhook Received');
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send();
    }
};
