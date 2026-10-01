import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getStockByItem } from "@/lib/stock";
import { istStamp, toCsv, type Cell } from "@/lib/csv";

const LIMIT = 20000;
const joinSerials = (serials: { serialNumber: string }[]) => serials.map((s) => s.serialNumber).join("; ");

async function buildRows(kind: string): Promise<Cell[][] | null> {
  switch (kind) {
    case "receipts": {
      const data = await prisma.receipt.findMany({
        where: { deletedAt: null },
        orderBy: { receivedAt: "desc" },
        take: LIMIT,
        include: { event: true, item: true, createdBy: true, serials: { select: { serialNumber: true } } },
      });
      return [
        ["Date", "Event", "Academic year", "Item", "Quantity", "Received from", "Serial numbers", "Remarks", "Entered by"],
        ...data.map((r) => [istStamp(r.receivedAt), r.event.name, r.event.academicYear, r.item.name, r.quantity, r.receivedFrom, joinSerials(r.serials), r.remarks, r.createdBy.name]),
      ];
    }
    case "distributions": {
      const data = await prisma.distribution.findMany({
        where: { deletedAt: null },
        orderBy: { distributedAt: "desc" },
        take: LIMIT,
        include: { event: true, item: true, recipientType: true, createdBy: true, serials: { select: { serialNumber: true } } },
      });
      return [
        ["Date", "Event", "Academic year", "Item", "Quantity", "Serial numbers", "Recipient type", "Recipient name", "Roll number", "Remarks", "Entered by"],
        ...data.map((d) => [istStamp(d.distributedAt), d.event.name, d.event.academicYear, d.item.name, d.quantity, joinSerials(d.serials), d.recipientType?.name, d.recipientName, d.rollNumber, d.remarks, d.createdBy.name]),
      ];
    }
    case "stock": {
      const data = await getStockByItem();
      return [
        ["Item", "Type", "Received", "Distributed", "In stock"],
        ...data.map((i) => [i.name, i.hasSerial ? "Serial numbers" : "Bulk", i.received, i.distributed, i.inStock]),
      ];
    }
    case "serials": {
      const data = await prisma.serialUnit.findMany({
        where: { receipt: { deletedAt: null } },
        orderBy: [{ itemId: "asc" }, { serialNumber: "asc" }],
        take: LIMIT,
        include: { item: true, receipt: { include: { event: true } }, distribution: { include: { event: true, recipientType: true } } },
      });
      return [
        ["Item", "Serial number", "Status", "Received for event", "Received from", "Received on", "Given at event", "Given to", "Roll number", "Recipient type", "Given on"],
        ...data.map((u) => [
          u.item.name, u.serialNumber, u.status === "IN_STOCK" ? "In stock" : "Distributed",
          u.receipt.event.name, u.receipt.receivedFrom, istStamp(u.receipt.receivedAt),
          u.distribution?.event.name, u.distribution?.recipientName, u.distribution?.rollNumber,
          u.distribution?.recipientType?.name, u.distribution ? istStamp(u.distribution.distributedAt) : null,
        ]),
      ];
    }
    default:
      return null;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Not signed in.", { status: 401 });
  if (!can(user.role, "records:export")) return new Response("Your role cannot export data.", { status: 403 });

  const { kind } = await params;
  const rows = await buildRows(kind);
  if (!rows) return new Response("Unknown export.", { status: 404 });

  await logAudit({ userId: user.id, action: "EXPORT", entityType: "Export", entityId: kind, details: { rows: rows.length - 1 } });

  const day = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="acm-${kind}-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
