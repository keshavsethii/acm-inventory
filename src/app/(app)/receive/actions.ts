"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { field, type FormState } from "@/lib/form";
import { UserError, hasPrismaCode } from "@/lib/errors";
import { parseSerialLines } from "@/lib/serials";

const schema = z.object({
  eventId: z.string().min(1, "Choose an event."),
  itemId: z.string().min(1, "Choose an item."),
  receivedFrom: z.string().min(1, "Enter who the goods came from.").max(120, "The source name is too long."),
  remarks: z.string().max(500, "Remarks are too long."),
});

export async function receiveGoods(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("records:create");
  const parsed = schema.safeParse({
    eventId: field(formData, "eventId"),
    itemId: field(formData, "itemId"),
    receivedFrom: field(formData, "receivedFrom"),
    remarks: field(formData, "remarks"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { eventId, itemId, receivedFrom, remarks } = parsed.data;
  const serialText = String(formData.get("serials") ?? "");
  const quantityText = field(formData, "quantity");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findFirst({ where: { id: eventId, deletedAt: null } });
      const item = await tx.item.findFirst({ where: { id: itemId, deletedAt: null } });
      if (!event || !item) throw new UserError("That event or item no longer exists.");

      let quantity: number;
      let serials: string[] = [];

      if (item.hasSerial) {
        const parsedSerials = parseSerialLines(serialText);
        if (parsedSerials.duplicates.length) {
          throw new UserError(`Repeated in your list: ${parsedSerials.duplicates.slice(0, 5).join(", ")}`);
        }
        serials = parsedSerials.serials;
        if (serials.length === 0) throw new UserError("Enter at least one serial number.");
        if (serials.length > 1000) throw new UserError("Add at most 1000 serial numbers at a time.");
        if (serials.some((s) => s.length > 100)) throw new UserError("A serial number is longer than 100 characters.");

        const clash = await tx.serialUnit.findMany({
          where: { itemId, serialNumber: { in: serials } },
          select: { serialNumber: true },
          take: 5,
        });
        if (clash.length) {
          throw new UserError(`Already recorded for this item: ${clash.map((c) => c.serialNumber).join(", ")}`);
        }
        quantity = serials.length;
      } else {
        quantity = Number(quantityText);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
          throw new UserError("Enter a whole number of units between 1 and 100000.");
        }
      }

      const receipt = await tx.receipt.create({
        data: { eventId, itemId, receivedFrom, quantity, remarks: remarks || null, createdById: user.id },
      });
      if (serials.length) {
        await tx.serialUnit.createMany({
          data: serials.map((serialNumber) => ({ serialNumber, itemId, receiptId: receipt.id })),
        });
      }
      await logAudit(
        {
          userId: user.id,
          action: "CREATE",
          entityType: "Receipt",
          entityId: receipt.id,
          details: { item: item.name, event: event.name, quantity, receivedFrom, serialized: item.hasSerial },
        },
        tx,
      );
      return { quantity, itemName: item.name };
    });

    revalidatePath("/receive");
    revalidatePath("/stock");
    return { success: `Recorded ${result.quantity} x ${result.itemName}.`, nonce: Date.now() };
  } catch (e) {
    if (e instanceof UserError) return { error: e.message };
    if (hasPrismaCode(e, "P2002")) return { error: "A serial number was just added by someone else. Check your list and try again." };
    throw e;
  }
}
