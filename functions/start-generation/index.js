const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Initialize Firebase Admin with default credentials (same project)
admin.initializeApp();

// Firestore client (same project)
const db = new Firestore();

const kieApiKey = process.env.KIE_API_KEY;
const webhookUrl = process.env.WEBHOOK_URL;

functions.http('startGeneration', async (req, res) => {
    console.log("CI/CD Verification Triggered - v1.3");
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // Helper to send NDJSON line
    const sendEvent = (data) => {
        res.write(JSON.stringify(data) + '\n');
    };

    let streamingStarted = false;

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
        const { prompt, duration, aspectRatio } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
        const videoDuration = duration === '10' ? '10' : '6';
        const videoAspectRatio = ['9:16', '16:9'].includes(aspectRatio) ? aspectRatio : '9:16';
        const creditCost = parseInt(videoDuration);

        // 3. Check Credits in Firestore
        const creditsRef = db.collection('credits').doc(uid);
        const creditsDoc = await creditsRef.get();

        // Default to 70s if no doc exists yet
        let secondsRemaining = 70;
        if (creditsDoc.exists) {
            secondsRemaining = creditsDoc.data().seconds_remaining;
        } else {
            // Initialize user
            await creditsRef.set({ seconds_remaining: 70, updated_at: new Date() });
        }

        if (secondsRemaining <= 0) {
            return res.status(403).json({ error: 'Insufficient credits' });
        }

        // 4. Switch to streaming mode
        res.writeHead(200, {
            'Content-Type': 'application/x-ndjson',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
        });
        streamingStarted = true;

        // 5. Generate Script with Gemini (Vertex AI) — stream chunks to client
        const { VertexAI } = require('@google-cloud/vertexai');
        const vertex_ai = new VertexAI({ project: 'gen-lang-client-0104807788', location: 'us-central1' });
        const model = 'gemini-2.5-flash';
        const generativeModel = vertex_ai.getGenerativeModel({ model: model });

        const scriptPrompt = `You are a professional video scriptwriter.
        Create a concise, engaging video script (approx 6-10 seconds) based on the following user idea: "${prompt}".

        The script should be visual and ready for video generation.
        Return ONLY the script text, no introductory or concluding remarks.`;

        const streamingResp = await generativeModel.generateContentStream(scriptPrompt);
        let generatedScript = '';
        for await (const item of streamingResp.stream) {
            const chunk = item.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (chunk) {
                generatedScript += chunk;
                sendEvent({ type: 'script', text: chunk });
            }
        }
        // Fallback for aggregated response
        if (!generatedScript) {
            const result = await streamingResp.response;
            generatedScript = result.candidates[0].content.parts[0].text;
            sendEvent({ type: 'script', text: generatedScript });
        }

        console.log("Generated Script:", generatedScript);

        // 6. Notify client: now generating video
        sendEvent({ type: 'status', message: 'Generating video...' });

        // 7. Call KIE AI Image-to-Video API with the Generated Script
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
                    duration: videoDuration,
                    aspect_ratio: videoAspectRatio
                },
                callBackUrl: webhookUrl
            }),
        });

        const kieData = await kieRes.json();

        if (kieData.code !== 200) {
            throw new Error(`KIE AI Error: ${kieData.msg || JSON.stringify(kieData)}`);
        }

        const taskId = kieData.data.taskId;

        // 8. Store in Firestore ("generations" collection)
        await db.collection('generations').doc(taskId).set({
            user_id: uid,
            original_prompt: prompt,
            generated_script: generatedScript,
            status: 'waiting',
            kie_task_id: taskId,
            created_at: new Date()
        });

        // 9. Deduct Credits
        await creditsRef.update({
            seconds_remaining: secondsRemaining - creditCost,
            updated_at: new Date()
        });

        // 10. Send final event with taskId
        sendEvent({ type: 'done', taskId: taskId });
        res.end();

    } catch (error) {
        console.error('Error:', error);
        if (streamingStarted) {
            sendEvent({ type: 'error', message: error.message });
            res.end();
        } else {
            return res.status(500).json({ error: error.message });
        }
    }
});
