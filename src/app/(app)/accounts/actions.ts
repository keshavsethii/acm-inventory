"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { hashPassword, passwordSchema } from "@/lib/password";

export type AccountState = { error?: string; success?: string };

const schema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1, "Name cannot be empty.").max(80),
});

export async function updateAccount(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const admin = await requirePermission("accounts:manage");

  const parsed = schema.safeParse({ userId: formData.get("userId"), name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Empty password box means "leave the password alone".
  const newPassword = String(formData.get("newPassword") ?? "");
  let passwordHash: string | undefined;
  if (newPassword) {
    const pw = passwordSchema.safeParse(newPassword);
    if (!pw.success) return { error: pw.error.issues[0].message };
    passwordHash = await hashPassword(pw.data);
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { name: parsed.data.name, ...(passwordHash && { passwordHash }) },
  });
  await logAudit({
    userId: admin.id,
    action: passwordHash ? "ACCOUNT_PASSWORD_RESET" : "ACCOUNT_UPDATED",
    entityType: "User",
    entityId: parsed.data.userId,
    details: { name: parsed.data.name, passwordReset: Boolean(passwordHash) },
  });

  revalidatePath("/accounts");
  return { success: passwordHash ? "Saved. Password was reset." : "Saved." };
}
