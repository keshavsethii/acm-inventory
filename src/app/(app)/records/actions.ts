"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { field, type FormState } from "@/lib/form";
import { UserError, withFriendlyErrors } from "@/lib/errors";
import { getItemStock } from "@/lib/stock";
import { SERIALIZABLE } from "@/lib/tx";

const reason = z.string().min(3, "Give a short reason (at least 3 characters).").max(200, "The reason is too long.");

function refresh() {
  revalidatePath("/records");
  revalidatePath("/receive");
  revalidatePath("/distribute");
  revalidatePath("/stock");
}

function parseQuantity(text: string) {
  const quantity = Number(text);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
    throw new UserError("Enter a whole number of units between 1 and 100000.");
  }
  return quantity;
}

// ---------------------------------------------------------------- receipts

const receiptSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1, "Choose an event."),
  receivedFrom: z.string().min(1, "Enter who the goods came from.").max(120, "The source name is too long."),
  remarks: z.string().max(500, "Remarks are too long."),
});

export async function updateReceipt(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("records:edit");
  const parsed = receiptSchema.safeParse({
    id: field(formData, "id"),
    eventId: field(formData, "eventId"),
    receivedFrom: field(formData, "receivedFrom"),
    remarks: field(formData, "remarks"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, eventId, receivedFrom, remarks } = parsed.data;
  const quantityText = field(formData, "quantity");

  return withFriendlyErrors(async () => {
    await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.findFirst({ where: { id, deletedAt: null }, include: { item: true } });
      if (!receipt) throw new UserError("This record no longer exists.");
      if (!(await tx.event.findFirst({ where: { id: eventId, deletedAt: null } }))) {
        throw new UserError("That event no longer exists.");
      }

      // Quantity can only be edited for bulk items. Serialized receipts change by deleting and re-entering.
      let quantity = receipt.quantity;
      if (!receipt.item.hasSerial && quantityText) {
        quantity = parseQuantity(quantityText);
        const delta = quantity - receipt.quantity;
        if (delta < 0 && (await getItemStock(tx, receipt.itemId)) + delta < 0) {
          throw new UserError("Cannot reduce the quantity: some of these units were already distributed.");
        }
      }

      await tx.receipt.update({ where: { id }, data: { eventId, receivedFrom, remarks: remarks || null, quantity } });
      await logAudit(
        {
          userId: user.id,
          action: "UPDATE",
          entityType: "Receipt",
          entityId: id,
          details: {
            before: { eventId: receipt.eventId, receivedFrom: receipt.receivedFrom, remarks: receipt.remarks, quantity: receipt.quantity },
            after: { eventId, receivedFrom, remarks: remarks || null, quantity },
          },
        },
        tx,
      );
    }, SERIALIZABLE);
    refresh();
    return { success: "Saved." };
  });
}

export async function deleteReceipt(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("records:delete");
  const id = field(formData, "id");
  const why = reason.safeParse(field(formData, "reason"));
  if (!id) return { error: "Missing record." };
  if (!why.success) return { error: why.error.issues[0].message };

  return withFriendlyErrors(async () => {
    await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.findFirst({
        where: { id, deletedAt: null },
        include: { item: true, event: true, serials: { select: { serialNumber: true, status: true } } },
      });
      if (!receipt) throw new UserError("This record no longer exists.");

      if (receipt.item.hasSerial) {
        const given = receipt.serials.filter((s) => s.status !== "IN_STOCK").map((s) => s.serialNumber);
        if (given.length) {
          throw new UserError(`These serial numbers were already given out: ${given.slice(0, 5).join(", ")}. Delete those distributions first.`);
        }
      } else if ((await getItemStock(tx, receipt.itemId)) - receipt.quantity < 0) {
        throw new UserError("Cannot delete: some of these units were already distributed. Delete or reduce those distributions first.");
      }

      await tx.receipt.update({ where: { id }, data: { deletedAt: new Date() } });
      // Serial rows go too, so a wrongly entered serial can be entered again correctly.
      // They are preserved in the audit log below.
      await tx.serialUnit.deleteMany({ where: { receiptId: id } });
      await logAudit(
        {
          userId: user.id,
          action: "DELETE",
          entityType: "Receipt",
          entityId: id,
          details: {
            reason: why.data,
            item: receipt.item.name,
            event: receipt.event.name,
            quantity: receipt.quantity,
            receivedFrom: receipt.receivedFrom,
            serials: receipt.serials.map((s) => s.serialNumber),
          },
        },
        tx,
      );
    }, SERIALIZABLE);
    refresh();
    return { success: "Deleted." };
  });
}

// ---------------------------------------------------------------- distributions

const distributionSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1, "Choose an event."),
  recipientTypeId: z.string(),
  recipientName: z.string().max(120, "The recipient name is too long."),
  rollNumber: z.string().max(40, "The roll number is too long."),
  remarks: z.string().max(500, "Remarks are too long."),
});

export async function updateDistribution(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("records:edit");
  const parsed = distributionSchema.safeParse({
    id: field(formData, "id"),
    eventId: field(formData, "eventId"),
    recipientTypeId: field(formData, "recipientTypeId"),
    recipientName: field(formData, "recipientName"),
    rollNumber: field(formData, "rollNumber"),
    remarks: field(formData, "remarks"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, eventId, recipientTypeId, recipientName, rollNumber, remarks } = parsed.data;
  const quantityText = field(formData, "quantity");

  return withFriendlyErrors(async () => {
    await prisma.$transaction(async (tx) => {
      const dist = await tx.distribution.findFirst({ where: { id, deletedAt: null }, include: { item: true } });
      if (!dist) throw new UserError("This record no longer exists.");
      if (!(await tx.event.findFirst({ where: { id: eventId, deletedAt: null } }))) {
        throw new UserError("That event no longer exists.");
      }
      if (recipientTypeId && recipientTypeId !== dist.recipientTypeId) {
        if (!(await tx.recipientType.findFirst({ where: { id: recipientTypeId, isActive: true } }))) {
          throw new UserError("That recipient type is not available.");
        }
      }
      if (dist.item.hasSerial && (!recipientTypeId || !recipientName)) {
        throw new UserError("For serial-numbered items, a recipient type and name are required.");
      }

      let quantity = dist.quantity;
      if (!dist.item.hasSerial && quantityText) {
        quantity = parseQuantity(quantityText);
        const delta = quantity - dist.quantity;
        if (delta > 0 && delta > (await getItemStock(tx, dist.itemId))) {
          throw new UserError("Not enough stock for that quantity.");
        }
      }

      const after = {
        eventId,
        recipientTypeId: recipientTypeId || null,
        recipientName: recipientName || null,
        rollNumber: rollNumber || null,
        remarks: remarks || null,
        quantity,
      };
      await tx.distribution.update({ where: { id }, data: after });
      await logAudit(
        {
          userId: user.id,
          action: "UPDATE",
          entityType: "Distribution",
          entityId: id,
          details: {
            before: {
              eventId: dist.eventId,
              recipientTypeId: dist.recipientTypeId,
              recipientName: dist.recipientName,
              rollNumber: dist.rollNumber,
              remarks: dist.remarks,
              quantity: dist.quantity,
            },
            after,
          },
        },
        tx,
      );
    }, SERIALIZABLE);
    refresh();
    return { success: "Saved." };
  });
}

// Undoes a distribution: the units go back into stock and the record is kept, marked as deleted.
export async function deleteDistribution(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("records:delete");
  const id = field(formData, "id");
  const why = reason.safeParse(field(formData, "reason"));
  if (!id) return { error: "Missing record." };
  if (!why.success) return { error: why.error.issues[0].message };

  return withFriendlyErrors(async () => {
    await prisma.$transaction(async (tx) => {
      const dist = await tx.distribution.findFirst({
        where: { id, deletedAt: null },
        include: { item: true, event: true, serials: { select: { serialNumber: true } } },
      });
      if (!dist) throw new UserError("This record no longer exists.");

      await tx.distribution.update({ where: { id }, data: { deletedAt: new Date() } });
      await tx.serialUnit.updateMany({
        where: { distributionId: id },
        data: { status: "IN_STOCK", distributionId: null },
      });
      await logAudit(
        {
          userId: user.id,
          action: "DELETE",
          entityType: "Distribution",
          entityId: id,
          details: {
            reason: why.data,
            item: dist.item.name,
            event: dist.event.name,
            quantity: dist.quantity,
            recipient: dist.recipientName,
            rollNumber: dist.rollNumber,
            serials: dist.serials.map((s) => s.serialNumber),
          },
        },
        tx,
      );
    }, SERIALIZABLE);
    refresh();
    return { success: "Deleted. The units are back in stock." };
  });
}
