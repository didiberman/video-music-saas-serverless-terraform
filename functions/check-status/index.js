const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');

// Initialize Firebase Admin with default credentials (same project)
admin.initializeApp();

// Firestore client (same project)
const db = new Firestore();

functions.http('checkStatus', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        // 1. Validate Auth
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

        // 2. Get taskId from query
        const taskId = req.query.taskId;
        if (!taskId) {
            return res.status(400).json({ error: 'taskId is required' });
        }

        // 3. Fetch from Firestore
        const docRef = db.collection('generations').doc(taskId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const data = doc.data();

        // 4. Verify ownership
        if (data.user_id !== uid) {
            return res.status(403).json({ error: 'Access denied' });
        }

        return res.status(200).json({
            status: data.status,
            video_url: data.video_url || null,
            audio_url: data.audio_url || null,
            audio_url_2: data.audio_url_2 || null,
            fail_message: data.fail_message || null,
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
});
