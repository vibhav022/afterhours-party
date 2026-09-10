import { clearAdminCookie, isSameOrigin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request." }, { status: 403 });
  return Response.json({ ok: true }, {
    headers: { "Set-Cookie": clearAdminCookie(), "Cache-Control": "no-store" },
  });
}
