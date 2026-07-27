const { flw } = require('../services/paymentService');

// Use the same export pattern as your authController
exports.initiatePayment = async (req, res) => {
    try {
        // This line helps you debug if your request fails
        console.log("SENDING THIS TO FLUTTERWAVE:", req.body);

        const { email, name, phone, amount } = req.body;

        // Basic check to ensure data exists before sending
        if (!email || !amount) {
            return res.status(400).json({ message: "Missing required payment details" });
        }

        const payload = {
            tx_ref: "tx-" + Date.now(), // Unique reference for each transaction
            amount: amount,
            currency: "UGX",
            redirect_url: "https://your-app.onrender.com/payment-success",
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
