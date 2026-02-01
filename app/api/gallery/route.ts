import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

// Public endpoint - no auth required
export async function GET() {
    try {
        const db = adminDb;

        // Fetch recent generations (filter in memory to avoid needing composite index)
        const generationsRef = db.collection("generations");
        const snapshot = await generationsRef
            .orderBy("created_at", "desc")
            .limit(50)
            .get();

        const items = snapshot.docs
            .filter((doc) => doc.data().status === "success")
            .map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: data.type || "video",
                    prompt: data.original_prompt || data.prompt || "",
                    videoUrl: data.video_url || null,
                    audioUrl: data.audio_url || null,
                    imageUrl: data.image_url || null,
                    createdAt: data.created_at?.toDate?.()?.toISOString() || null,
                };
            })
            .filter((item) => item.videoUrl || item.audioUrl); // Only items with actual media

        return NextResponse.json({ items });
    } catch (error) {
        console.error("Gallery fetch error:", error);
        return NextResponse.json({ items: [] });
    }
}
