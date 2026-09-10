import { isAdminRequest, isSameOrigin } from "@/lib/admin-auth";
import { getSql } from "@/db/rsvp";

type RsvpRow = {
  id: string;
  name: string;
  college: string;
  phone: string;
  consent: string;
  created_at: string;
};

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id, name, college, phone, consent, created_at
      FROM rsvps ORDER BY created_at DESC LIMIT 2000
    ` as unknown as RsvpRow[];
    return Response.json({ rows, total: rows.length }, {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch {
    return Response.json({ error: "Could not load RSVPs." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request) || !(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Invalid request." }, { status: 415 });
  }
  try {
    const raw = await request.text();
    if (raw.length > 200) return Response.json({ error: "Invalid RSVP." }, { status: 400 });
    const id = String(JSON.parse(raw)?.id || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({ error: "Invalid RSVP." }, { status: 400 });
    }
    const sql = getSql();
    const result = await sql`DELETE FROM rsvps WHERE id = ${id} RETURNING id` as unknown as { id: string }[];
    if (!result.length) return Response.json({ error: "This RSVP no longer exists." }, { status: 404 });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not remove this RSVP." }, { status: 503 });
  }
}
