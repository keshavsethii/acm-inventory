import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import ExportLinks from "@/components/export-links";
import { getStockByEvent, getStockByItem } from "@/lib/stock";
import { pillBlue, pillGray, tableClass, tdClass, thClass } from "../../ui";
import PageShell from "@/components/page-shell";

export default async function StockPage() {
  const user = await requireUser();
  const [byItem, byEvent] = await Promise.all([getStockByItem(), getStockByEvent()]);

  return (
    <PageShell eyebrow="Overview" title="Stock" description="Received, distributed and what is left, by item and by event." actions={can(user.role, "records:export") ? <ExportLinks /> : null}>

      <section>
        <h2 className="mb-2 text-lg font-semibold tracking-tight">By item</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Item</th><th className={thClass}>Type</th><th className={thClass}>Received</th>
                <th className={thClass}>Distributed</th><th className={thClass}>In stock</th>
              </tr>
            </thead>
            <tbody>
              {byItem.length === 0 && <tr><td className={tdClass} colSpan={5}>No items yet.</td></tr>}
              {byItem.map((i) => (
                <tr key={i.id}>
                  <td className={tdClass}>{i.name}</td>
                  <td className={tdClass}><span className={i.hasSerial ? pillBlue : pillGray}>{i.hasSerial ? "Serial numbers" : "Bulk"}</span></td>
                  <td className={tdClass}>{i.received}</td>
                  <td className={tdClass}>{i.distributed}</td>
                  <td className={`${tdClass} text-base font-semibold`}>{i.inStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">By event</h2>
        {byEvent.length === 0 && <p className="text-sm text-muted">No events yet.</p>}
        {byEvent.map((e) => (
          <div key={e.id} className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <div className="border-b border-line px-3 py-2 text-sm font-medium">
              {e.name} <span className="font-normal text-muted">({e.academicYear})</span>
            </div>
            <table className={tableClass}>
              <thead>
                <tr><th className={thClass}>Item</th><th className={thClass}>Received</th><th className={thClass}>Distributed</th><th className={thClass}>Left from this event</th></tr>
              </thead>
              <tbody>
                {e.rows.length === 0 && <tr><td className={tdClass} colSpan={4}>No activity yet.</td></tr>}
                {e.rows.map((r) => (
                  <tr key={r.item}>
                    <td className={tdClass}>{r.item}</td>
                    <td className={tdClass}>{r.received}</td>
                    <td className={tdClass}>{r.distributed}</td>
                    <td className={tdClass}>{r.received - r.distributed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </PageShell>
  );
}
