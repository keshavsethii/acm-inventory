import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export async function logAudit(entry: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({ data: entry });
}
