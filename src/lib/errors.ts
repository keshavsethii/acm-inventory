import { Prisma } from "@prisma/client";
import type { FormState } from "./form";

// Thrown inside actions for problems the user can fix. The message is shown on screen.
export class UserError extends Error {}

export function hasPrismaCode(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

// Runs an action body and turns expected problems into on-screen messages.
export async function withFriendlyErrors(run: () => Promise<FormState>): Promise<FormState> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof UserError) return { error: e.message };
    if (hasPrismaCode(e, "P2034")) return { error: "Another entry was being saved at the same moment. Please try again." };
    throw e;
  }
}
