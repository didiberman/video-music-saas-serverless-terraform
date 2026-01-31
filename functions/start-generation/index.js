const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Initialize Firebase Admin with kiesaas credentials (for auth token verification only)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Use a separate Firestore client that uses the default credentials
// of the Cloud Function's own project (gen-lang-client-0104807788)
const db = new Firestore();

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
        const { prompt, duration } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
        const videoDuration = duration === '10' ? '10' : '6';
        const creditCost = parseInt(videoDuration);

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

        // 4. Generate Script with Gemini (Vertex AI)
        const { VertexAI } = require('@google-cloud/vertexai');
        const vertex_ai = new VertexAI({ project: 'gen-lang-client-0104807788', location: 'us-central1' });
        const model = 'gemini-1.5-flash-001';
        const generativeModel = vertex_ai.preview.getGenerativeModel({ model: model });

        const scriptPrompt = `You are a professional video scriptwriter.
        Create a concise, engaging video script (approx 6-10 seconds) based on the following user idea: "${prompt}".

        The script should be visual and ready for video generation.
        Return ONLY the script text, no introductory or concluding remarks.`;

        const streamingResp = await generativeModel.generateContentStream(scriptPrompt);
        let generatedScript = '';
        for await (const item of streamingResp.stream) {
            generatedScript += item.candidates[0].content.parts[0].text;
        }
        // Fallback for aggregated response
        if (!generatedScript) {
            const result = await streamingResp.response;
            generatedScript = result.candidates[0].content.parts[0].text;
        }

        console.log("Generated Script:", generatedScript);

        // 5. Call KIE AI Image-to-Video API with the Generated Script
        const kieRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${kieApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "grok-imagine/image-to-video",
                input: {
                    prompt: generatedScript,
                    mode: "normal",
                    duration: videoDuration
                },
                callBackUrl: webhookUrl
            }),
        });

        const kieData = await kieRes.json();

        if (kieData.code !== 200) {
            throw new Error(`KIE AI Error: ${kieData.msg || JSON.stringify(kieData)}`);
        }

        const taskId = kieData.data.taskId;

        // 6. Store in Firestore ("generations" collection)
        await db.collection('generations').doc(taskId).set({
            user_id: uid,
            original_prompt: prompt,
            generated_script: generatedScript,
            status: 'waiting',
            kie_task_id: taskId,
            created_at: new Date()
        });

        // 7. Deduct Credits
        await creditsRef.update({
            seconds_remaining: secondsRemaining - creditCost,
            updated_at: new Date()
        });

        return res.status(200).json({ success: true, id: taskId });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
});
