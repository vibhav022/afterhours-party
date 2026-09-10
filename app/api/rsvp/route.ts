import { getSql } from "@/db/rsvp";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
const schema = z.object({
  name: z.string().trim().min(2).max(80),
  college: z.string().trim().min(2).max(120),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return Response.json({error:"Please submit from the event website."},{status:403});
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({error:"Invalid request."},{status:415});
  let payload;
  try {
    const raw = await request.text();
    if (raw.length > 3000) return Response.json({error:"Request too large."},{status:413});
    payload = schema.safeParse(JSON.parse(raw));
  } catch { return Response.json({error:"Check your details and try again."},{status:400}); }
  if (!payload.success) return Response.json({error:"Enter your name, college, a valid 10-digit Indian mobile number, and accept the RSVP notice."},{status:400});
  if (Date.now() >= Date.parse("2026-09-17T00:00:00+05:30")) return Response.json({error:"RSVPs for this event have closed."},{status:410});
  try {
    const limit = await enforceRateLimit(request, { scope: "rsvp", limit: 20, windowMs: 10 * 60 * 1000 });
    if (!limit.allowed) return Response.json({error:"Too many RSVP attempts from this connection. Please try again shortly."},{status:429,headers:{"Retry-After":String(limit.retryAfter),"Cache-Control":"no-store"}});
    const {name,college,phone} = payload.data;
    const sql = getSql();
    await sql`
      INSERT INTO rsvps (id, name, college, phone, consent)
      VALUES (${crypto.randomUUID()}, ${name}, ${college}, ${phone}, ${"Agreed to use of details for Afterhours 16 September 2026 RSVP and event updates."})
      ON CONFLICT (phone) DO NOTHING
    `;
    return Response.json({ok:true},{status:200,headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    console.error("RSVP save failed", error instanceof Error ? error.message : "Database error");
    return Response.json({error:"We couldn’t save your RSVP. Your details are still here—please try again shortly."},{status:503});
  }
}
