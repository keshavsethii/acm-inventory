import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Visit /api/health to confirm the app can reach the database.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected" });
  } catch {
    return Response.json(
      { status: "error", database: "not reachable - check DATABASE_URL in .env" },
      { status: 500 },
    );
  }
}
