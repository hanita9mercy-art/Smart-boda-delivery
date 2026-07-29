const Flutterwave = require('flutterwave-node-v3');
const Ride = require('../rideModel');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

exports.initiatePayment = async (req, res) => {
    try {
        const { email, name, phone, amount } = req.body;
        if (!email || !amount) return res.status(400).json({ message: "Missing details" });

        const payload = {
            tx_ref: "tx-" + Date.now(),
            amount: amount,
            currency: "UGX",
            payment_options: "mobilemoney, banktransfer, card",
            redirect_url: "https://smart-boda-delivery.onrender.com/payment-success",
            customer: { email, name, phonenumber: phone },
            customizations: { 
                title: "Smart Boda Delivery", 
                description: "Ride Payment" 
            }
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
        const signature = req.headers["verif-hash"];

        // Verify the webhook signature
        if (!signature || signature !== secretHash) {
            return res.status(401).send('Unauthorized');
        }

        const eventData = req.body.data;
        if (eventData && eventData.status === 'successful') {
            await Ride.findOneAndUpdate(
                { transactionId: eventData.tx_ref }, 
                { status: 'paid' },
                { new: true }
            );
            console.log(`Ride ${eventData.tx_ref} marked as paid.`);
        }
        
        res.status(200).send('Webhook Received');
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send();
    }
};
