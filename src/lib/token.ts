import { SignJWT, jwtVerify } from "jose";

// Pure token helpers (no Next.js imports) so the proxy can use them too.
export const SESSION_COOKIE = "acm_session";
export const SESSION_HOURS = 12;

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or shorter than 32 characters. See .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export function signToken(userId: string) {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(key());
}

export async function readToken(token?: string): Promise<{ userId: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return typeof payload.uid === "string" ? { userId: payload.uid } : null;
  } catch {
    return null;
  }
}
