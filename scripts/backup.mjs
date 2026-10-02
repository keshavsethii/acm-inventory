// Saves a full copy of the database to backups/ using pg_dump.
// Usage (from the project folder):  npm run db:backup
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: DIRECT_URL may still be set in the environment.
}

const url = process.env.DIRECT_URL;
if (!url) {
  console.error("DIRECT_URL is not set. Run this from the project folder, where the .env file is.");
  process.exit(1);
}

mkdirSync("backups", { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const file = join("backups", `acm-inventory-${stamp}.dump`);

const result = spawnSync(
  "pg_dump",
  ["--format=custom", "--no-owner", "--no-privileges", "--file", file, url],
  { stdio: ["ignore", "inherit", "inherit"] },
);

if (result.error && result.error.code === "ENOENT") {
  console.error("pg_dump was not found. Install the PostgreSQL command line tools (see docs/HANDOVER.md, section Backups).");
  process.exit(1);
}
if (result.status !== 0) {
  rmSync(file, { force: true });
  console.error("Backup failed. If the message above mentions a version mismatch, install a pg_dump that is at least as new as the database server.");
  process.exit(result.status ?? 1);
}

console.log(`Backup saved: ${file} (${Math.round(statSync(file).size / 1024)} KB)`);
console.log("Keep a copy somewhere other than this computer. Backups contain personal data: do not put them on GitHub.");
