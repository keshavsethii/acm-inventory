import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

type Db = PrismaClient | Prisma.TransactionClient;

// Stock is never stored: it is always received minus distributed (ignoring removed records).
export async function getItemStock(db: Db, itemId: string) {
  const received = await db.receipt.aggregate({ where: { itemId, deletedAt: null }, _sum: { quantity: true } });
  const given = await db.distribution.aggregate({ where: { itemId, deletedAt: null }, _sum: { quantity: true } });
  return (received._sum.quantity ?? 0) - (given._sum.quantity ?? 0);
}

export async function getStockByItem() {
  const [items, received, given] = await Promise.all([
    prisma.item.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.receipt.groupBy({ by: ["itemId"], where: { deletedAt: null }, _sum: { quantity: true } }),
    prisma.distribution.groupBy({ by: ["itemId"], where: { deletedAt: null }, _sum: { quantity: true } }),
  ]);
  const r = new Map(received.map((x) => [x.itemId, x._sum.quantity ?? 0]));
  const g = new Map(given.map((x) => [x.itemId, x._sum.quantity ?? 0]));
  return items.map((i) => {
    const rec = r.get(i.id) ?? 0;
    const out = g.get(i.id) ?? 0;
    return { id: i.id, name: i.name, hasSerial: i.hasSerial, received: rec, distributed: out, inStock: rec - out };
  });
}

export async function getStockByEvent() {
  const [events, items, received, given] = await Promise.all([
    prisma.event.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.item.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
    prisma.receipt.groupBy({ by: ["eventId", "itemId"], where: { deletedAt: null }, _sum: { quantity: true } }),
    prisma.distribution.groupBy({ by: ["eventId", "itemId"], where: { deletedAt: null }, _sum: { quantity: true } }),
  ]);
  const itemName = new Map(items.map((i) => [i.id, i.name]));
  return events.map((e) => {
    const rows = new Map<string, { item: string; received: number; distributed: number }>();
    const row = (itemId: string) => {
      if (!rows.has(itemId)) rows.set(itemId, { item: itemName.get(itemId) ?? "Unknown", received: 0, distributed: 0 });
      return rows.get(itemId)!;
    };
    received.filter((x) => x.eventId === e.id).forEach((x) => (row(x.itemId).received = x._sum.quantity ?? 0));
    given.filter((x) => x.eventId === e.id).forEach((x) => (row(x.itemId).distributed = x._sum.quantity ?? 0));
    return { id: e.id, name: e.name, academicYear: e.academicYear, rows: [...rows.values()].sort((a, b) => a.item.localeCompare(b.item)) };
  });
}
