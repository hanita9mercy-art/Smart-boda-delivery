const { flw } = require('../services/paymentService');

// Use the same export pattern as your authController
exports.initiatePayment = async (req, res) => {
    try {
        const { email, name, phone, amount } = req.body;

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
