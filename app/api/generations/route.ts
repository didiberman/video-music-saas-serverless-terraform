const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Call the list-generations endpoint
        const listUrl = API_URL?.replace("start-generation", "list-generations");
        if (!listUrl) {
            return new Response(JSON.stringify({ error: "API Configuration Missing" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const response = await fetch(listUrl, {
            headers: { "Authorization": authHeader },
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
