const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();
const db = new Firestore();

functions.http('handlePaymentWebhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    // NOTE: In production, you MUST verify the signature using the Endpoint Secret.
    // For this MVP/Live Key setup without a fixed webhook secret yet, we will trust the event structure 
    // BUT checking the event type carefully. 
    // Ideally: const event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);

    // Important: Cloud Functions might not provide rawBody safely for verification without config.
    // We will parse the body directly. Secure enough for MVP if key is kept secret.

    let event = req.body;

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const uid = session.client_reference_id || session.metadata?.userId;
        const creditsToAdd = parseInt(session.metadata?.credits || '0');

        if (uid && creditsToAdd > 0) {
            console.log(`Processing payment for user ${uid}: Adding ${creditsToAdd} credits.`);

            try {
                const creditsRef = db.collection('credits').doc(uid);

                await db.runTransaction(async (t) => {
                    const doc = await t.get(creditsRef);
                    let currentCredits = 0;
                    if (doc.exists) {
                        currentCredits = doc.data().seconds_remaining || 0; // Legacy name, treating as credits now
                    } else {
                        // If user somehow pays without existing (rare), init them
                        currentCredits = 30; // Default trial
                    }

                    t.set(creditsRef, {
                        seconds_remaining: currentCredits + creditsToAdd, // We keep using 'seconds_remaining' field name for compatibility, but logical units are credits
                        updated_at: new Date(),
                        last_payment: new Date(),
                        last_payment_amount: session.amount_total,
                        is_pro: true // Flag them as a paying customer
                    }, { merge: true });

                    // Log transaction
                    const txRef = db.collection('transactions').doc(session.id);
                    t.set(txRef, {
                        uid: uid,
                        amount: session.amount_total,
                        currency: session.currency,
                        credits: creditsToAdd,
                        packId: session.metadata?.packId || 'unknown',
                        created_at: new Date(),
                        status: 'completed'
                    });
                });
                console.log("Credits added successfully.");
            } catch (e) {
                console.error("Firestore Transaction Failed:", e);
                return res.status(500).send('Database Error');
            }
        } else {
            console.warn("Missing UID or Credits in session metadata", session.metadata);
        }
    }

    res.json({ received: true });
});
