import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export async function logAudit(
  entry: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: Prisma.InputJsonValue;
  },
  db: PrismaClient | Prisma.TransactionClient = prisma,
) {
  await db.auditLog.create({ data: entry });
}
