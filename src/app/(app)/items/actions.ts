"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { field, type FormState } from "@/lib/form";
import { hasPrismaCode } from "@/lib/errors";

const itemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Enter an item name.").max(120, "Item name is too long."),
  description: z.string().max(300, "Description is too long."),
});

// Creates an item, or edits one when an id is sent.
export async function saveItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("catalogue:manage");
  const parsed = itemSchema.safeParse({
    id: field(formData, "id"),
    name: field(formData, "name"),
    description: field(formData, "description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, name } = parsed.data;
  const description = parsed.data.description || null;
  const hasSerial = formData.get("hasSerial") === "on";

  const duplicate = await prisma.item.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, ...(id ? { NOT: { id } } : {}) },
  });
  if (duplicate) return { error: "An item with this name already exists." };

  try {
    if (id) {
      // Once goods have been received, serial tracking cannot be switched without corrupting stock.
      const used = await prisma.receipt.count({ where: { itemId: id } });
      const current = await prisma.item.findUniqueOrThrow({ where: { id } });
      await prisma.item.update({
        where: { id },
        data: { name, description, hasSerial: used > 0 ? current.hasSerial : hasSerial },
      });
      await logAudit({ userId: user.id, action: "UPDATE", entityType: "Item", entityId: id, details: { name } });
      revalidatePath("/items");
      return { success: "Saved." };
    }
    const created = await prisma.item.create({ data: { name, description, hasSerial } });
    await logAudit({ userId: user.id, action: "CREATE", entityType: "Item", entityId: created.id, details: { name, hasSerial } });
  } catch (e) {
    if (hasPrismaCode(e, "P2002")) return { error: "An item with this name already exists." };
    throw e;
  }
  revalidatePath("/items");
  return { success: `Added "${name}".`, nonce: Date.now() };
}

export async function addRecipientType(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("catalogue:manage");
  const name = field(formData, "name");
  if (!name || name.length > 40) return { error: "Enter a name up to 40 characters." };

  const duplicate = await prisma.recipientType.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (duplicate) return { error: "That recipient type already exists." };

  const created = await prisma.recipientType.create({ data: { name } });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "RecipientType", entityId: created.id, details: { name } });
  revalidatePath("/items");
  return { success: `Added "${name}".`, nonce: Date.now() };
}

// Hides or shows a recipient type in the dropdown. Old records keep their type.
export async function toggleRecipientType(id: string) {
  const user = await requirePermission("catalogue:manage");
  const type = await prisma.recipientType.findUniqueOrThrow({ where: { id } });
  await prisma.recipientType.update({ where: { id }, data: { isActive: !type.isActive } });
  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "RecipientType",
    entityId: id,
    details: { name: type.name, isActive: !type.isActive },
  });
  revalidatePath("/items");
}
