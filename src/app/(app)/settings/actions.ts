"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { hashPassword, passwordSchema, verifyPassword } from "@/lib/password";

export type PasswordState = { error?: string; success?: boolean };

const schema = z
  .object({ current: z.string().min(1), next: passwordSchema, confirm: z.string() })
  .refine((v) => v.next === v.confirm, { message: "The new passwords do not match.", path: ["confirm"] });

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.current, record.passwordHash))) {
    return { error: "Your current password is wrong." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.next) } });
  await logAudit({ userId: user.id, action: "PASSWORD_CHANGED", entityType: "User", entityId: user.id });
  return { success: true };
}
