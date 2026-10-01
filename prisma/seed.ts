import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Default dropdown values for the distribution form.
// Safe to run more than once: existing rows are left alone.
const RECIPIENT_TYPES = ["Winner", "Participant", "Organizer"];

async function main() {
  for (const name of RECIPIENT_TYPES) {
    await prisma.recipientType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded recipient types: ${RECIPIENT_TYPES.join(", ")}`);
  // The five login accounts are seeded in Phase 2 (they need password hashing).
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
