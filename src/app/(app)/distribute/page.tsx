import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { getStockByItem } from "@/lib/stock";
import ActionForm from "@/components/action-form";
import ActivityFeed from "@/components/activity-feed";
import PageShell from "@/components/page-shell";
import { cardClass, sectionTitleClass } from "../../ui";
import { distributeGoods } from "./actions";
import DistributeFields from "./distribute-fields";

export default async function DistributePage() {
  await requirePermission("records:create");
  const [events, stock, types, units, recent] = await Promise.all([
    prisma.event.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } }),
    getStockByItem(),
    prisma.recipientType.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.serialUnit.findMany({
      where: { status: "IN_STOCK", item: { deletedAt: null }, receipt: { deletedAt: null } },
      select: { itemId: true, serialNumber: true },
      orderBy: { serialNumber: "asc" },
    }),
    prisma.distribution.findMany({ where: { deletedAt: null }, orderBy: { distributedAt: "desc" }, take: 5, include: { item: true } }),
  ]);

  const serialsByItem: Record<string, string[]> = {};
  for (const u of units) (serialsByItem[u.itemId] ??= []).push(u.serialNumber);
  const ready = events.length > 0 && stock.length > 0;

  return (
    <PageShell title="Distribute goods" description="Give items to winners, participants and organizers.">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {ready ? (
          <section className={cardClass}>
            <ActionForm action={distributeGoods} submitLabel="Record distribution" className="space-y-5">
              <DistributeFields
                events={events.map((e) => ({ id: e.id, label: `${e.name} (${e.academicYear})` }))}
                items={stock.map((s) => ({ id: s.id, name: s.name, hasSerial: s.hasSerial, stock: s.inStock }))}
                types={types.map((t) => ({ id: t.id, name: t.name }))}
                serialsByItem={serialsByItem}
              />
            </ActionForm>
          </section>
        ) : (
          <section className={`${cardClass} text-sm text-muted`}>An event and an item must exist first.</section>
        )}
        <aside className="space-y-3">
          <h2 className={sectionTitleClass}>Just given out</h2>
          <ActivityFeed
            empty="Nothing yet."
            items={recent.map((d) => ({
              id: d.id,
              kind: "out" as const,
              title: `${d.quantity} × ${d.item.name}`,
              sub: d.recipientName ? `to ${d.recipientName}` : "no recipient recorded",
              when: d.distributedAt,
            }))}
          />
        </aside>
      </div>
    </PageShell>
  );
}
