const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin
admin.initializeApp();

functions.http('createCheckoutSession', async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        // 1. Verify Auth
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // 2. Get Pack Info
        const { packId } = req.body; // 'starter', 'creator', 'pro'

        let priceAmount = 0;
        let creditsAmount = 0;
        let packName = '';

        switch (packId) {
            case 'starter':
                priceAmount = 900; // $9.00
                creditsAmount = 100;
                packName = 'Starter Pack (100 Credits)';
                break;
            case 'creator':
                priceAmount = 2500; // $25.00
                creditsAmount = 400;
                packName = 'Creator Pack (400 Credits)';
                break;
            case 'pro':
                priceAmount = 5000; // $50.00
                creditsAmount = 1000;
                packName = 'Pro Pack (1000 Credits)';
                break;
            default:
                return res.status(400).json({ error: 'Invalid pack ID' });
        }

        // 3. Create Stripe Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: packName,
                            description: `${creditsAmount} Vibe Credits`,
                        },
                        unit_amount: priceAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.origin}/?payment=success`,
            cancel_url: `${req.headers.origin}/?payment=canceled`,
            client_reference_id: uid,
            metadata: {
                userId: uid,
                credits: creditsAmount.toString(),
                packId: packId
            },
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: error.message });
    }
});
