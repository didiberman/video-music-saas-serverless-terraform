const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore();

functions.http('handleWebhook', async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        // New KIE API callback format matches the Query Task response:
        // { code, msg, data: { taskId, model, state, param, resultJson, failMsg, ... } }
        const body = req.body;
        const data = body.data || body;

        const taskId = data.taskId;
        const state = data.state; // "waiting", "success", "fail"

        if (!taskId || !state) {
            console.error('Invalid payload:', JSON.stringify(body));
            return res.status(400).json({ error: "Invalid Payload: missing taskId or state" });
        }

        console.log(`Received webhook for Task ${taskId}: ${state}`);

        // Extract video URL from resultJson if task succeeded
        let mediaUrl = null;
        if (state === 'success' && data.resultJson) {
            try {
                const result = typeof data.resultJson === 'string'
                    ? JSON.parse(data.resultJson)
                    : data.resultJson;
                if (result.resultUrls && result.resultUrls.length > 0) {
                    mediaUrl = result.resultUrls[0];
                }
            } catch (e) {
                console.error('Failed to parse resultJson:', e);
            }
        }

        // Get the existing document to check type
        const docRef = firestore.collection('generations').doc(taskId);
        const docSnap = await docRef.get();
        const docData = docSnap.exists ? docSnap.data() : {};
        const generationType = docData.type || 'video';

        // Update Firestore document
        const updateData = {
            status: state,
            updated_at: new Date()
        };

        if (mediaUrl) {
            // Use appropriate field based on type
            if (generationType === 'music') {
                updateData.audio_url = mediaUrl;
            } else {
                updateData.video_url = mediaUrl;
            }
        }

        if (state === 'fail' && data.failMsg) {
            updateData.fail_message = data.failMsg;
        }

        await docRef.update(updateData);

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
