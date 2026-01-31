const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Initialize Firebase Admin (Cross-Project Credentials)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const kieApiKey = process.env.KIE_API_KEY;
const webhookUrl = process.env.WEBHOOK_URL;

functions.http('startGeneration', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        // 1. Validate Auth (Firebase ID Token)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (e) {
            console.error("Token verification failed:", e);
            return res.status(401).json({ error: 'Invalid Token' });
        }

        const uid = decodedToken.uid;

        // 2. Parse Body
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        // 3. Check Credits in Firestore
        const creditsRef = db.collection('credits').doc(uid);
        const creditsDoc = await creditsRef.get();

        // Default to 30s if no doc exists yet
        let secondsRemaining = 30;
        if (creditsDoc.exists) {
            secondsRemaining = creditsDoc.data().seconds_remaining;
        } else {
            // Initialize user
            await creditsRef.set({ seconds_remaining: 30, updated_at: new Date() });
        }

        if (secondsRemaining <= 0) {
            return res.status(403).json({ error: 'Insufficient credits' });
        }

        // 4. Call KIE AI
        const kieRes = await fetch('https://api.kie.ai/v1/videos/generate', {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${kieApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
                model: "k-2.0",
                callback_url: webhookUrl,
                aspect_ratio: "16:9"
            }),
        });

        if (!kieRes.ok) {
            const errText = await kieRes.text();
            throw new Error(`KIE AI Error: ${errText}`);
        }

        const kieData = await kieRes.json();

        // 5. Store in Firestore ("generations" collection)
        await db.collection('generations').doc(kieData.id).set({
            user_id: uid,
            prompt: prompt,
            status: 'pending',
            kie_id: kieData.id,
            created_at: new Date()
        });

        // 6. Deduct Credits
        await creditsRef.update({
            seconds_remaining: secondsRemaining - 5,
            updated_at: new Date()
        });

        return res.status(200).json({ success: true, id: kieData.id });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
});
