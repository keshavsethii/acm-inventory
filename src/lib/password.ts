import bcrypt from "bcryptjs";
import { z } from "zod";

// bcrypt only uses the first 72 bytes, hence the upper limit.
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Use at most 72 characters.");

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
