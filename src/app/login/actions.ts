"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

export type LoginState = { error?: string };

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

const schema = z.object({
  username: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

// Used so a wrong username takes as long to reject as a wrong password.
let dummyHash: Promise<string> | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your username and password." };
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });

  if (user) {
    // Lock the account after 5 failed attempts since the last successful login.
    const lastLogin = await prisma.auditLog.findFirst({
      where: { userId: user.id, action: "LOGIN" },
      orderBy: { createdAt: "desc" },
    });
    const windowStart = new Date(Date.now() - LOCK_MINUTES * 60_000);
    const since = lastLogin && lastLogin.createdAt > windowStart ? lastLogin.createdAt : windowStart;
    const fails = await prisma.auditLog.count({
      where: { userId: user.id, action: "LOGIN_FAILED", createdAt: { gt: since } },
    });
    if (fails >= MAX_FAILS) {
      return { error: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.` };
    }
  }

  dummyHash ??= hashPassword("not-a-real-password");
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));

  if (!user || !user.isActive || !ok) {
    if (user) {
      await logAudit({ userId: user.id, action: "LOGIN_FAILED", entityType: "User", entityId: user.id });
    }
    return { error: "Wrong username or password." };
  }

  await createSession(user.id);
  await logAudit({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id });
  redirect("/");
}

export async function logout() {
  const user = await getCurrentUser();
  if (user) {
    await logAudit({ userId: user.id, action: "LOGOUT", entityType: "User", entityId: user.id });
  }
  await destroySession();
  redirect("/login");
}
