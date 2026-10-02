import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getStockByItem } from "@/lib/stock";
import ActionForm from "@/components/action-form";
import { cardClass, tableClass, tdClass, thClass } from "../../ui";
import { distributeGoods } from "./actions";
import DistributeFields from "./distribute-fields";
import PageShell from "@/components/page-shell";

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
    prisma.distribution.findMany({
      where: { deletedAt: null },
      orderBy: { distributedAt: "desc" },
      take: 8,
      include: { event: true, item: true, recipientType: true, createdBy: true, serials: { select: { serialNumber: true } } },
    }),
  ]);

  const serialsByItem: Record<string, string[]> = {};
  for (const u of units) (serialsByItem[u.itemId] ??= []).push(u.serialNumber);

  return (
    <PageShell eyebrow="Stock out" title="Distribute goods" description="Hand items to winners, participants and organizers. Serial numbers are tracked per person.">
      {events.length === 0 || stock.length === 0 ? (
        <p className="text-sm text-muted">An event and an item must exist first.</p>
      ) : (
        <section className={`${cardClass} max-w-2xl`}>
          <ActionForm action={distributeGoods} submitLabel="Record distribution">
            <DistributeFields
              events={events.map((e) => ({ id: e.id, label: `${e.name} (${e.academicYear})` }))}
              items={stock.map((s) => ({ id: s.id, name: s.name, hasSerial: s.hasSerial, stock: s.inStock }))}
              types={types.map((t) => ({ id: t.id, name: t.name }))}
              serialsByItem={serialsByItem}
            />
          </ActionForm>
        </section>
      )}
      <section>
        <h2 className="mb-2 text-lg font-semibold tracking-tight">Recently distributed</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>When</th><th className={thClass}>Event</th><th className={thClass}>Item</th>
                <th className={thClass}>Qty / serials</th><th className={thClass}>To</th><th className={thClass}>By</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && <tr><td className={tdClass} colSpan={6}>Nothing distributed yet.</td></tr>}
              {recent.map((d) => (
                <tr key={d.id}>
                  <td className={tdClass}>{formatDateTime(d.distributedAt)}</td>
                  <td className={tdClass}>{d.event.name}</td>
                  <td className={tdClass}>{d.item.name}</td>
                  <td className={tdClass}>
                    {d.serials.length ? d.serials.map((s) => s.serialNumber).join(", ") : d.quantity}
                  </td>
                  <td className={tdClass}>
                    {[d.recipientName, d.rollNumber, d.recipientType?.name].filter(Boolean).join(" · ") || "-"}
                  </td>
                  <td className={tdClass}>{d.createdBy.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
