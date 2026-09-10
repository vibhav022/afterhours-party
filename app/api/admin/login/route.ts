import { adminPasswordMatches, adminTotpMatches, createAdminCookie, isSameOrigin } from "@/lib/admin-auth";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Invalid request." }, { status: 415 });
  }
  try {
    const limit = await enforceRateLimit(request, { scope: "admin_login_v2", limit: 10, windowMs: 10 * 60 * 1000 });
    if (!limit.allowed) return Response.json({ error: "Too many sign-in attempts. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } });
    const raw = await request.text();
    if (raw.length > 500) return Response.json({ error: "Invalid password." }, { status: 401 });
    const body = JSON.parse(raw);
    const password = String(body?.password || "");
    const code = String(body?.code || "");
    await new Promise((resolve) => setTimeout(resolve, 450));
    if (!password || password.length > 200 || !adminPasswordMatches(password) || !(await adminTotpMatches(code))) {
      return Response.json({ error: "Incorrect password or authenticator code." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ ok: true }, {
      headers: { "Set-Cookie": await createAdminCookie(), "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Unable to sign in." }, { status: 400 });
  }
}
