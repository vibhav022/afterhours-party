import { getSql } from "@/db/rsvp";

type Options = {
  scope: string;
  limit: number;
  windowMs: number;
};

type Counter = { count: number };

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")
    || "unknown";
}

export async function enforceRateLimit(request: Request, options: Options) {
  const now = Date.now();
  const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
  const sql = getSql();
  const result = await sql`
    INSERT INTO rate_limits (scope, client_key, window_start, count)
    VALUES (${options.scope}, ${clientKey(request)}, ${windowStart}, 1)
    ON CONFLICT (scope, client_key, window_start)
    DO UPDATE SET count = rate_limits.count + 1, updated_at = CURRENT_TIMESTAMP
    RETURNING count
  ` as unknown as Counter[];
  const count = Number(result[0]?.count || 0);
  return {
    allowed: count <= options.limit,
    retryAfter: Math.max(1, Math.ceil((windowStart + options.windowMs - now) / 1000)),
  };
}
