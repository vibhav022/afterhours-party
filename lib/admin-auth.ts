const COOKIE_NAME = "__Host-afterhours_admin";
const SESSION_SECONDS = 60 * 60 * 8;

type AdminEnv = {
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  ADMIN_TOTP_SECRET?: string;
};

function config() {
  const runtime = process.env as AdminEnv;
  if (!runtime.ADMIN_PASSWORD || !runtime.ADMIN_SESSION_SECRET || !runtime.ADMIN_TOTP_SECRET) {
    throw new Error("Admin authentication is not configured");
  }
  return runtime;
}

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

function safeEqual(left: string, right: string) {
  const a = bytes(left);
  const b = bytes(right);
  let different = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index++) {
    different |= (a[index % Math.max(a.length, 1)] ?? 0) ^ (b[index % Math.max(b.length, 1)] ?? 0);
  }
  return different === 0;
}

async function signature(expires: string) {
  const secret = config().ADMIN_SESSION_SECRET!;
  const key = await crypto.subtle.importKey("raw", bytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, bytes(expires));
  return btoa(String.fromCharCode(...new Uint8Array(signed))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function adminPasswordMatches(candidate: string) {
  return safeEqual(candidate, config().ADMIN_PASSWORD!);
}

function base32(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = value.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let buffer = 0;
  const output: number[] = [];
  for (const character of clean) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Invalid authenticator secret");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

async function totp(offset = 0) {
  const step = Math.floor(Date.now() / 30_000) + offset;
  const counter = new Uint8Array(8);
  let value = step;
  for (let index = 7; index >= 0; index--) {
    counter[index] = value & 255;
    value = Math.floor(value / 256);
  }
  const key = await crypto.subtle.importKey("raw", base32(config().ADMIN_TOTP_SECRET!), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, counter));
  const start = signed[signed.length - 1] & 15;
  const number = ((signed[start] & 127) << 24) | (signed[start + 1] << 16) | (signed[start + 2] << 8) | signed[start + 3];
  return String(number % 1_000_000).padStart(6, "0");
}

export async function adminTotpMatches(candidate: string) {
  if (!/^\d{6}$/.test(candidate)) return false;
  return safeEqual(candidate, await totp(-1)) || safeEqual(candidate, await totp()) || safeEqual(candidate, await totp(1));
}

export async function createAdminCookie() {
  const expires = String(Date.now() + SESSION_SECONDS * 1000);
  const token = `${expires}.${await signature(expires)}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearAdminCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAdminRequest(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  const [expires, provided] = match[1].split(".");
  if (!expires || !provided || !/^\d+$/.test(expires) || Number(expires) <= Date.now()) return false;
  return safeEqual(provided, await signature(expires));
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}
