"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { field, type FormState } from "@/lib/form";

const schema = z.object({
  id: z.string(),
  name: z.string().min(1, "Enter an event name.").max(120, "Event name is too long."),
  eventDate: z.string(),
  academicYear: z.string().regex(/^\d{4}-\d{2}$/, "Use the academic year format 2026-27."),
});

// Creates an event, or edits one when an id is sent.
export async function saveEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("catalogue:manage");
  const parsed = schema.safeParse({
    id: field(formData, "id"),
    name: field(formData, "name"),
    eventDate: field(formData, "eventDate"),
    academicYear: field(formData, "academicYear"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, name, academicYear } = parsed.data;
  const eventDate = parsed.data.eventDate ? new Date(parsed.data.eventDate) : null;
  if (eventDate && Number.isNaN(eventDate.getTime())) return { error: "That date is not valid." };

  const duplicate = await prisma.event.findFirst({
    where: { deletedAt: null, academicYear, name: { equals: name, mode: "insensitive" }, ...(id ? { NOT: { id } } : {}) },
  });
  if (duplicate) return { error: "An event with this name already exists in that academic year." };

  if (id) {
    await prisma.event.update({ where: { id }, data: { name, eventDate, academicYear } });
    await logAudit({ userId: user.id, action: "UPDATE", entityType: "Event", entityId: id, details: { name, academicYear } });
    revalidatePath("/events");
    return { success: "Saved." };
  }

  const created = await prisma.event.create({ data: { name, eventDate, academicYear } });
  await logAudit({ userId: user.id, action: "CREATE", entityType: "Event", entityId: created.id, details: { name, academicYear } });
  revalidatePath("/events");
  return { success: `Added "${name}".`, nonce: Date.now() };
}
