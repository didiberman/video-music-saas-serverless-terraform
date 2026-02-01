import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { headers } from "next/headers";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

// Hardcoded admin emails (add yours here)
const ADMIN_EMAILS = [
    "yadid@example.com", // Replace with your actual admin email
];

interface UserStats {
    uid: string;
    email: string | null;
    displayName: string | null;
    secondsRemaining: number;
    videoCount: number;
    lastActivity: string | null;
}

interface VideoRecord {
    taskId: string;
    userId: string;
    userEmail: string | null;
    prompt: string;
    script: string;
    status: string;
    videoUrl: string | null;
    createdAt: string;
}

export async function GET(request: Request) {
    try {
        // 1. Verify caller is authenticated and is an admin
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Check if user is admin
        const userRecord = await adminAuth.getUser(decodedToken.uid);
        if (!userRecord.email || !ADMIN_EMAILS.includes(userRecord.email)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Fetch all credits (user seconds)
        const creditsSnapshot = await adminDb.collection("credits").get();
        const creditsMap: Record<string, number> = {};
        creditsSnapshot.forEach((doc) => {
            creditsMap[doc.id] = doc.data().seconds_remaining || 0;
        });

        // 3. Fetch all generations (videos)
        const generationsSnapshot = await adminDb
            .collection("generations")
            .orderBy("created_at", "desc")
            .get();

        const videoCountMap: Record<string, number> = {};
        const lastActivityMap: Record<string, Date> = {};
        const videos: VideoRecord[] = [];

        for (const doc of generationsSnapshot.docs) {
            const data = doc.data();
            const userId = data.user_id;

            // Count videos per user
            videoCountMap[userId] = (videoCountMap[userId] || 0) + 1;

            // Track last activity
            const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);
            if (!lastActivityMap[userId] || createdAt > lastActivityMap[userId]) {
                lastActivityMap[userId] = createdAt;
            }

            videos.push({
                taskId: doc.id,
                userId: userId,
                userEmail: null, // Will be resolved below
                prompt: data.original_prompt || "",
                script: data.generated_script || "",
                status: data.status || "unknown",
                videoUrl: data.video_url || null,
                createdAt: createdAt.toISOString(),
            });
        }

        // 4. Get unique user IDs and resolve emails
        const allUserIds = new Set([
            ...Object.keys(creditsMap),
            ...Object.keys(videoCountMap),
        ]);

        const userStats: UserStats[] = [];
        const emailMap: Record<string, string | null> = {};

        for (const uid of allUserIds) {
            try {
                const user = await adminAuth.getUser(uid);
                emailMap[uid] = user.email || null;
                userStats.push({
                    uid,
                    email: user.email || null,
                    displayName: user.displayName || null,
                    secondsRemaining: creditsMap[uid] || 0,
                    videoCount: videoCountMap[uid] || 0,
                    lastActivity: lastActivityMap[uid]?.toISOString() || null,
                });
            } catch {
                // User might have been deleted
                userStats.push({
                    uid,
                    email: null,
                    displayName: null,
                    secondsRemaining: creditsMap[uid] || 0,
                    videoCount: videoCountMap[uid] || 0,
                    lastActivity: lastActivityMap[uid]?.toISOString() || null,
                });
            }
        }

        // Sort by video count descending
        userStats.sort((a, b) => b.videoCount - a.videoCount);

        // Add emails to videos
        const videosWithEmail = videos.map((v) => ({
            ...v,
            userEmail: emailMap[v.userId] || null,
        }));

        return NextResponse.json({
            users: userStats,
            videos: videosWithEmail,
            summary: {
                totalUsers: userStats.length,
                totalVideos: videos.length,
                totalSecondsRemaining: userStats.reduce((sum, u) => sum + u.secondsRemaining, 0),
            },
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal error" },
            { status: 500 }
        );
    }
}
