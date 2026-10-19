import { signOfficeToken } from "../_shared/auth.ts";
import { jsonResponse, optionsResponse } from "../_shared/cors.ts";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const pinSecret = Deno.env.get("OFFICE_PIN");
  const jwtSecret = Deno.env.get("OFFICE_JWT_SECRET") ?? pinSecret;
  if (!pinSecret || !jwtSecret) {
    return jsonResponse({ error: "Server not configured" }, 500);
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return jsonResponse({ error: "Too many attempts. Try again later." }, 429);
  }

  let body: { pin?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const pin = String(body.pin ?? "").trim();
  if (!pin || pin !== pinSecret) {
    return jsonResponse({ error: "Invalid PIN" }, 401);
  }

  attempts.delete(ip);
  const session = await signOfficeToken(jwtSecret);
  return jsonResponse(session);
});
