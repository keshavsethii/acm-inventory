import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Default dropdown values for the distribution form.
const RECIPIENT_TYPES = ["Winner", "Participant", "Organizer"];

// One account per role. Passwords come from .env (SEED_PASSWORD_*), never from the code.
const ACCOUNTS: { role: Role; username: string; name: string; envKey: string }[] = [
  { role: "CHAIR", username: "chair", name: "Chair", envKey: "SEED_PASSWORD_CHAIR" },
  { role: "VICE_CHAIR", username: "vicechair", name: "Vice Chair", envKey: "SEED_PASSWORD_VICE_CHAIR" },
  { role: "TREASURER", username: "treasurer", name: "Treasurer", envKey: "SEED_PASSWORD_TREASURER" },
  { role: "SECRETARY", username: "secretary", name: "Secretary", envKey: "SEED_PASSWORD_SECRETARY" },
  { role: "VOLUNTEER", username: "volunteer", name: "Volunteer", envKey: "SEED_PASSWORD_VOLUNTEER" },
];

// `npm run db:seed -- --reset-passwords` overwrites passwords of existing accounts.
const RESET = process.argv.includes("--reset-passwords");

async function main() {
  for (const name of RECIPIENT_TYPES) {
    await prisma.recipientType.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`Recipient types ready: ${RECIPIENT_TYPES.join(", ")}`);

  for (const a of ACCOUNTS) {
    const password = process.env[a.envKey];
    const existing = await prisma.user.findUnique({ where: { role: a.role } });

    if (!password) {
      if (!existing) console.warn(`Skipped ${a.name}: ${a.envKey} is not set in .env`);
      continue;
    }
    if (password.length < 10) {
      console.warn(`Skipped ${a.name}: ${a.envKey} must be at least 10 characters`);
      continue;
    }
    if (existing && !RESET) {
      console.log(`${a.name}: account already exists (use --reset-passwords to change the password)`);
      continue;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
      where: { role: a.role },
      update: { passwordHash },
      create: { role: a.role, username: a.username, name: a.name, passwordHash },
    });
    console.log(`${a.name}: ${existing ? "password reset" : "account created"} (username: ${a.username})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
