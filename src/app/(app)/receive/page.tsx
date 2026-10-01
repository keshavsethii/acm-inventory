import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import ActionForm from "@/components/action-form";
import { cardClass, tableClass, tdClass, thClass } from "../../ui";
import { receiveGoods } from "./actions";
import ReceiveFields from "./receive-fields";

export default async function ReceivePage() {
  await requirePermission("records:create");
  const [events, items, recent] = await Promise.all([
    prisma.event.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.item.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.receipt.findMany({
      where: { deletedAt: null },
      orderBy: { receivedAt: "desc" },
      take: 8,
      include: { event: true, item: true, createdBy: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Receive goods</h1>
      {events.length === 0 || items.length === 0 ? (
        <p className="text-sm text-zinc-500">An event and an item must exist first. Ask an officer to add them under Events and Items.</p>
      ) : (
        <section className={`${cardClass} max-w-2xl`}>
          <ActionForm action={receiveGoods} submitLabel="Record goods">
            <ReceiveFields
              events={events.map((e) => ({ id: e.id, label: `${e.name} (${e.academicYear})` }))}
              items={items.map((i) => ({ id: i.id, name: i.name, hasSerial: i.hasSerial }))}
            />
          </ActionForm>
        </section>
      )}
      <section>
        <h2 className="mb-2 font-medium">Recently received</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className={tableClass}>
            <thead>
              <tr><th className={thClass}>When</th><th className={thClass}>Event</th><th className={thClass}>Item</th><th className={thClass}>Qty</th><th className={thClass}>From</th><th className={thClass}>By</th></tr>
            </thead>
            <tbody>
              {recent.length === 0 && <tr><td className={tdClass} colSpan={6}>Nothing received yet.</td></tr>}
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className={tdClass}>{formatDateTime(r.receivedAt)}</td>
                  <td className={tdClass}>{r.event.name}</td>
                  <td className={tdClass}>{r.item.name}</td>
                  <td className={tdClass}>{r.quantity}</td>
                  <td className={tdClass}>{r.receivedFrom}</td>
                  <td className={tdClass}>{r.createdBy.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
