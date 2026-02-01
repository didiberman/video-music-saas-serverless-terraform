const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');

admin.initializeApp();
const db = new Firestore();

// Hardcoded admin email for extra security check
const ADMIN_EMAIL = 'yadidb@gmail.com';

functions.http('adminStats', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        // 1. Verify Auth & Admin Role
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid Token' });
        }

        if (decodedToken.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Access Denied: Admin only' });
        }

        // 2. Fetch Users (Auth) + Credit Stats
        // List last 100 users
        const listUsersResult = await admin.auth().listUsers(100);

        const authUsers = listUsersResult.users.map(u => ({
            uid: u.uid,
            email: u.email,
            created_at: u.metadata.creationTime,
            photoURL: u.photoURL
        })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Fetch Credit Docs for all users in parallel
        // Firestore limits getAll to a reasonable number, but 100 is fine.
        const creditRefs = authUsers.map(u => db.collection('credits').doc(u.uid));

        let users = [];
        if (creditRefs.length > 0) {
            const creditsSnap = await db.getAll(...creditRefs);

            users = authUsers.map((u, index) => {
                const creditDoc = creditsSnap[index];
                const data = creditDoc.exists ? creditDoc.data() : {};
                return {
                    ...u,
                    credits: data.seconds_remaining ?? 0, // 0 usually implies new user default (30) not yet init
                    generation_count: data.generation_count || 0
                };
            });
        } else {
            users = authUsers.map(u => ({ ...u, credits: 0, generation_count: 0 }));
        }

        // 3. Fetch Recent Generations
        const gensSnap = await db.collection('generations')
            .orderBy('created_at', 'desc')
            .limit(20)
            .get();

        const generations = gensSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate?.() || null
        }));

        // 4. Fetch Recent Payments
        const txSnap = await db.collection('transactions')
            .orderBy('created_at', 'desc')
            .limit(20)
            .get();

        const transactions = txSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate?.() || null
        }));

        return res.status(200).json({
            users: users.slice(0, 100),
            generations,
            transactions
        });

    } catch (error) {
        console.error('Admin Stats Error:', error);
        return res.status(500).json({ error: error.message });
    }
});
