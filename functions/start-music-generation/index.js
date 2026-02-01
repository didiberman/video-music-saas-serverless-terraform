const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Initialize Firebase Admin with default credentials (same project)
admin.initializeApp();

// Firestore client (same project)
const db = new Firestore();

const kieApiKey = process.env.KIE_API_KEY;
const webhookUrl = process.env.MUSIC_WEBHOOK_URL || process.env.WEBHOOK_URL;

// Constants
const FREE_SONGS_PER_USER = 2;

functions.http('startMusicGeneration', async (req, res) => {
    console.log("Music Generation Triggered - v1.0");
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

        // Check if user is admin (has high video credits = >10000 seconds)
        const videoCreditsDoc = await db.collection('credits').doc(uid).get();
        const videoSeconds = videoCreditsDoc.exists ? videoCreditsDoc.data().seconds_remaining : 0;
        const isAdmin = videoSeconds > 10000;

        // 2. Parse Body
        const { prompt, style } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        // 3. Check Music Credits in Firestore (skip for admin)
        let songsRemaining = FREE_SONGS_PER_USER;
        const musicCreditsRef = db.collection('music_credits').doc(uid);

        if (!isAdmin) {
            const musicCreditsDoc = await musicCreditsRef.get();
            if (musicCreditsDoc.exists) {
                songsRemaining = musicCreditsDoc.data().songs_remaining;
            } else {
                // Initialize user with free songs
                await musicCreditsRef.set({ songs_remaining: FREE_SONGS_PER_USER, updated_at: new Date() });
            }

            if (songsRemaining <= 0) {
                return res.status(403).json({ error: 'No music credits remaining. You have used your 2 free songs.' });
            }
        }

        // 4. Switch to streaming mode
        res.writeHead(200, {
            'Content-Type': 'application/x-ndjson',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
        });
        streamingStarted = true;

        // 5. Generate Lyrics with Gemini (Vertex AI) — stream chunks to client
        const { VertexAI } = require('@google-cloud/vertexai');
        const vertex_ai = new VertexAI({ project: 'gen-lang-client-0104807788', location: 'us-central1' });
        const model = 'gemini-2.5-flash';
        const generativeModel = vertex_ai.getGenerativeModel({ model: model });

        const lyricsPrompt = `You are a professional songwriter. Create VERY SHORT song lyrics (for a 60-second song maximum) based on: "${prompt}".

CRITICAL: Keep it SHORT - only 1 verse and 1 chorus. Around 60-80 words total.

Structure:
[Verse]
4 lines

[Chorus]
4 lines

That's it. No more verses or bridges. The song must be under 60 seconds when sung.
Return ONLY the lyrics text, no labels, no remarks.`;

        const streamingResp = await generativeModel.generateContentStream(lyricsPrompt);
        let generatedLyrics = '';
        for await (const item of streamingResp.stream) {
            const chunk = item.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (chunk) {
                generatedLyrics += chunk;
                sendEvent({ type: 'lyrics', text: chunk });
            }
        }
        // Fallback for aggregated response
        if (!generatedLyrics) {
            const result = await streamingResp.response;
            generatedLyrics = result.candidates[0].content.parts[0].text;
            sendEvent({ type: 'lyrics', text: generatedLyrics });
        }

        console.log("Generated Lyrics:", generatedLyrics.substring(0, 200) + "...");

        // 6. Notify client: now generating music
        sendEvent({ type: 'status', message: 'Generating music...' });

        // 7. Call KIE Suno API with customMode for duration control
        // duration options: 61 (~1min), 122 (~2min), 183 (~3min), 244 (~4min)
        const kieRes = await fetch('https://api.kie.ai/api/v1/generate', {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${kieApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                customMode: true,
                prompt: generatedLyrics.substring(0, 3000), // Lyrics go in 'prompt' for customMode
                style: style || "pop, upbeat, catchy",  // Use user style or default
                title: "AI Generated Song",    // Required for customMode
                instrumental: false,
                model: "V4",  // V4 has 4min max
                callBackUrl: webhookUrl
            }),
        });

        const kieData = await kieRes.json();

        if (kieData.code !== 200) {
            throw new Error(`KIE Suno API Error: ${kieData.msg || JSON.stringify(kieData)}`);
        }

        const taskId = kieData.data.taskId;

        // 8. Store in Firestore ("generations" collection with type: music)
        await db.collection('generations').doc(taskId).set({
            user_id: uid,
            type: 'music',
            original_prompt: prompt,
            generated_lyrics: generatedLyrics,
            status: 'waiting',
            kie_task_id: taskId,
            created_at: new Date()
        });

        // 9. Deduct Music Credit
        await musicCreditsRef.update({
            songs_remaining: songsRemaining - 1,
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
