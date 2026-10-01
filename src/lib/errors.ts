import { Prisma } from "@prisma/client";

// Thrown inside actions for problems the user can fix. The message is shown on screen.
export class UserError extends Error {}

export function hasPrismaCode(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
