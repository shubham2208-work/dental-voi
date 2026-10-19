const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signOfficeToken(secret: string, ttlSeconds = 60 * 60 * 8): Promise<{ token: string; expires_at: string }> {
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = base64UrlEncode(encoder.encode(JSON.stringify({ role: "office", exp })));
  const data = `${header}.${payload}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const token = `${data}.${base64UrlEncode(new Uint8Array(sig))}`;
  return { token, expires_at: new Date(exp * 1000).toISOString() };
}

export async function verifyOfficeToken(secret: string, authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const key = await hmacKey(secret);
  const data = `${parts[0]}.${parts[1]}`;
  const sig = base64UrlDecode(parts[2]);
  const valid = await crypto.subtle.verify("HMAC", key, sig, encoder.encode(data));
  if (!valid) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1]))) as { role?: string; exp?: number };
    if (payload.role !== "office") return false;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function requireAuth(secret: string, req: Request): Promise<Response | null> {
  return verifyOfficeToken(secret, req.headers.get("Authorization")).then((ok) =>
    ok ? null : new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } }),
  );
}
