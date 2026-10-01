import type { Role } from "@prisma/client";

// Single place that decides who can do what. Change a role list here and the whole app follows.
export type Permission =
  | "records:create" // add receipts and distributions
  | "records:edit"
  | "records:delete"
  | "catalogue:manage" // events, items, recipient types
  | "audit:view"
  | "accounts:manage"; // rename accounts, reset passwords

const OFFICERS: Role[] = ["CHAIR", "VICE_CHAIR", "TREASURER", "SECRETARY"];

const MATRIX: Record<Permission, Role[]> = {
  "records:create": [...OFFICERS, "VOLUNTEER"],
  "records:edit": OFFICERS,
  "records:delete": OFFICERS,
  "catalogue:manage": OFFICERS,
  "audit:view": OFFICERS,
  "accounts:manage": ["CHAIR", "VICE_CHAIR"],
};

export function can(role: Role, permission: Permission) {
  return MATRIX[permission].includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  CHAIR: "Chair",
  VICE_CHAIR: "Vice Chair",
  TREASURER: "Treasurer",
  SECRETARY: "Secretary",
  VOLUNTEER: "Volunteer",
};
