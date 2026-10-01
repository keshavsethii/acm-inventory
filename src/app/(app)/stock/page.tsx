import { requireUser } from "@/lib/auth";
import { getStockByEvent, getStockByItem } from "@/lib/stock";
import { tableClass, tdClass, thClass } from "../../ui";

export default async function StockPage() {
  await requireUser();
  const [byItem, byEvent] = await Promise.all([getStockByItem(), getStockByEvent()]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Stock</h1>

      <section>
        <h2 className="mb-2 font-medium">By item</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
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
                  <td className={tdClass}>{i.hasSerial ? "Serial numbers" : "Bulk"}</td>
                  <td className={tdClass}>{i.received}</td>
                  <td className={tdClass}>{i.distributed}</td>
                  <td className={`${tdClass} font-medium`}>{i.inStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-medium">By event</h2>
        {byEvent.length === 0 && <p className="text-sm text-zinc-500">No events yet.</p>}
        {byEvent.map((e) => (
          <div key={e.id} className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-3 py-2 text-sm font-medium">
              {e.name} <span className="font-normal text-zinc-500">({e.academicYear})</span>
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
    </div>
  );
}
