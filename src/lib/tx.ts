import { Prisma } from "@prisma/client";

// Use for anything that checks stock and then changes it, so two people acting at the same
// moment cannot both succeed on the same units.
export const SERIALIZABLE = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable } as const;
