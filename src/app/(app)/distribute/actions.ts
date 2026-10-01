"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { field, type FormState } from "@/lib/form";
import { UserError, hasPrismaCode } from "@/lib/errors";
import { getItemStock } from "@/lib/stock";

const schema = z.object({
  eventId: z.string().min(1, "Choose an event."),
  itemId: z.string().min(1, "Choose an item."),
  recipientTypeId: z.string(),
  recipientName: z.string().max(120, "The recipient name is too long."),
  rollNumber: z.string().max(40, "The roll number is too long."),
  remarks: z.string().max(500, "Remarks are too long."),
});

export async function distributeGoods(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("records:create");
  const parsed = schema.safeParse({
    eventId: field(formData, "eventId"),
    itemId: field(formData, "itemId"),
    recipientTypeId: field(formData, "recipientTypeId"),
    recipientName: field(formData, "recipientName"),
    rollNumber: field(formData, "rollNumber"),
    remarks: field(formData, "remarks"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { eventId, itemId, recipientTypeId, recipientName, rollNumber, remarks } = parsed.data;
  const pickedSerials = [...new Set(formData.getAll("serials").map(String))];
  const quantityText = field(formData, "quantity");

  try {
    // Serializable isolation: two people distributing at the same moment cannot both take the last unit.
    const result = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findFirst({ where: { id: eventId, deletedAt: null } });
        const item = await tx.item.findFirst({ where: { id: itemId, deletedAt: null } });
        if (!event || !item) throw new UserError("That event or item no longer exists.");

        if (recipientTypeId) {
          const type = await tx.recipientType.findFirst({ where: { id: recipientTypeId, isActive: true } });
          if (!type) throw new UserError("That recipient type is not available.");
        }

        let quantity: number;
        let unitIds: string[] = [];

        if (item.hasSerial) {
          if (!recipientTypeId || !recipientName) {
            throw new UserError("For serial-numbered items, choose a recipient type and enter the recipient's name.");
          }
          if (pickedSerials.length === 0) throw new UserError("Select at least one serial number.");
          const units = await tx.serialUnit.findMany({
            where: { itemId, serialNumber: { in: pickedSerials }, status: "IN_STOCK", receipt: { deletedAt: null } },
            select: { id: true },
          });
          if (units.length !== pickedSerials.length) {
            throw new UserError("Some of the selected serial numbers are no longer in stock. Reload the page and try again.");
          }
          unitIds = units.map((u) => u.id);
          quantity = units.length;
        } else {
          quantity = Number(quantityText);
          if (!Number.isInteger(quantity) || quantity < 1) throw new UserError("Enter a whole number of units.");
          const stock = await getItemStock(tx, itemId);
          if (quantity > stock) throw new UserError(`Only ${stock} of ${item.name} in stock.`);
        }

        const distribution = await tx.distribution.create({
          data: {
            eventId,
            itemId,
            quantity,
            recipientTypeId: recipientTypeId || null,
            recipientName: recipientName || null,
            rollNumber: rollNumber || null,
            remarks: remarks || null,
            createdById: user.id,
          },
        });

        if (unitIds.length) {
          const updated = await tx.serialUnit.updateMany({
            where: { id: { in: unitIds }, status: "IN_STOCK" },
            data: { status: "DISTRIBUTED", distributionId: distribution.id },
          });
          if (updated.count !== unitIds.length) {
            throw new UserError("Someone else just distributed one of these serial numbers. Please try again.");
          }
        }

        await logAudit(
          {
            userId: user.id,
            action: "CREATE",
            entityType: "Distribution",
            entityId: distribution.id,
            details: {
              item: item.name,
              event: event.name,
              quantity,
              recipient: recipientName || null,
              serials: item.hasSerial ? pickedSerials : [],
            },
          },
          tx,
        );
        return { quantity, itemName: item.name };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    revalidatePath("/distribute");
    revalidatePath("/stock");
    return { success: `Distributed ${result.quantity} x ${result.itemName}.`, nonce: Date.now() };
  } catch (e) {
    if (e instanceof UserError) return { error: e.message };
    if (hasPrismaCode(e, "P2034")) return { error: "Another entry was being saved at the same moment. Please submit again." };
    throw e;
  }
}
