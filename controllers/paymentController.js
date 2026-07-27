// Step out of the 'controllers' folder to find these in the root
const { flw } = require('../paymentService');
const Ride = require('../rideModel'); 

// 1. Function to create the payment link
exports.initiatePayment = async (req, res) => {
    try {
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

// 2. Function to handle incoming Webhooks from Flutterwave
exports.handleWebhook = async (req, res) => {
    try {
        const secretHash = process.env.FLW_SECRET_HASH;
        const signature = req.headers["verif-hash"];

        if (!signature || signature !== secretHash) {
            return res.status(401).send('Unauthorized');
        }

        const event = req.body;

        if (event.data.status === 'successful') {
            const txRef = event.data.tx_ref;

            const updatedRide = await Ride.findOneAndUpdate(
                { transactionId: txRef }, 
                { status: 'paid' }, 
                { new: true }
            );

            if (!updatedRide) {
                console.warn("Payment successful, but no ride found with ref:", txRef);
            }
        }

        res.status(200).send('Webhook Received');
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send();
    }
};
