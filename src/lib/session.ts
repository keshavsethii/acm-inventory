import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_HOURS, signToken } from "./token";

export async function createSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, await signToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
