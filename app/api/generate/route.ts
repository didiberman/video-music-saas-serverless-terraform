import { NextResponse } from "next/server";

// Runtime Environment Variable (Injected by Cloud Run)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
    try {
        if (!API_URL) {
            return NextResponse.json({ error: "API Configuration Missing" }, { status: 500 });
        }

        const body = await req.json();
        const authHeader = req.headers.get("authorization");

        // Proxy the request to the Cloud Function
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader || "",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
