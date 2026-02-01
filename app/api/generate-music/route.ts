import { NextRequest, NextResponse } from "next/server";

const MUSIC_API_URL = process.env.NEXT_PUBLIC_MUSIC_API_URL ||
    "https://us-central1-gen-lang-client-0104807788.cloudfunctions.net/start-music-generation";

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const response = await fetch(MUSIC_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
            },
            body: JSON.stringify(body),
        });

        // Stream the response back to client
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("ndjson")) {
            // Forward streaming response
            return new NextResponse(response.body, {
                headers: {
                    "Content-Type": "application/x-ndjson",
                    "Transfer-Encoding": "chunked",
                    "Cache-Control": "no-cache",
                },
            });
        }

        // Non-streaming (error) response
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error("Music generation proxy error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal error" },
            { status: 500 }
        );
    }
}
