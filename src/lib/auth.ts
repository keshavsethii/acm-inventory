import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { SESSION_COOKIE, readToken } from "./token";
import { can, type Permission } from "./permissions";

// The signed cookie only proves who the user is. The database decides if they may still log in.
export const getCurrentUser = cache(async () => {
  const session = await readToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, username: true, role: true, isActive: true },
  });
  return user?.isActive ? user : null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Use at the top of every page and server action that needs a specific permission.
export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect("/");
  return user;
}
