import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Checks a member's name and password for the secret door behind the study bookshelf.
// Members live in SECRET_DOOR_MEMBERS as `name:salt:hash` entries separated by `;`, made with
// `node scripts/member.mjs <name> <password>`. Passwords never reach the client bundle.
const derive = promisify(scrypt) as (password: string, salt: Buffer, length: number) => Promise<Buffer>;
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW = 10 * 60 * 1000, LIMIT = 8;

function members() {
  const list = new Map<string, { salt: Buffer; hash: Buffer }>();
  for (const entry of (process.env.SECRET_DOOR_MEMBERS ?? "").split(";")) {
    const [name, salt, hash] = entry.trim().split(":");
    if (name && salt && hash) list.set(name.toLowerCase(), { salt: Buffer.from(salt, "hex"), hash: Buffer.from(hash, "hex") });
  }
  return list;
}

export async function POST(request: Request) {
  // Best effort per instance: slows guessing without any extra service.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local", now = Date.now();
  const seen = attempts.get(ip);
  if (seen && seen.until > now && seen.count >= LIMIT) return Response.json({ ok: false, error: "Too many tries. Wait a few minutes." }, { status: 429 });
  let body: { username?: unknown; password?: unknown } = {};
  try { body = await request.json(); } catch { /* treated as empty */ }
  const username = typeof body.username === "string" ? body.username.trim().slice(0, 64) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 256) : "";
  const member = members().get(username.toLowerCase());
  // Unknown names still pay for a hash, so timing does not reveal who is a member.
  const expected = member?.hash ?? Buffer.alloc(64), actual = await derive(password, member?.salt ?? Buffer.alloc(16), expected.length);
  if (member && password && timingSafeEqual(actual, expected)) { attempts.delete(ip); return Response.json({ ok: true, name: username }); }
  attempts.set(ip, { count: (seen && seen.until > now ? seen.count : 0) + 1, until: now + WINDOW });
  return Response.json({ ok: false, error: "That name and password don’t match." }, { status: 401 });
}
