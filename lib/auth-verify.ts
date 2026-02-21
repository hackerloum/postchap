import { adminAuth } from "@/lib/firebase/admin";

export async function verifyRequest(request: Request): Promise<string> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer "))
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  const token = authHeader.slice("Bearer ".length);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
