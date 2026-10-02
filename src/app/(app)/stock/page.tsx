import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getStockByEvent, getStockByItem } from "@/lib/stock";
import ExportLinks from "@/components/export-links";
import PageShell from "@/components/page-shell";
import Tabs from "@/components/tabs";
import { cardClass, emptyClass, pillBlue, pillGray } from "../../ui";

type Params = Record<string, string | string[] | undefined>;

export default async function StockPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const view = (Array.isArray(sp.view) ? sp.view[0] : sp.view) === "events" ? "events" : "items";

  return (
    <PageShell
      title="Stock"
      description="What came in, what went out and what is left."
      actions={can(user.role, "records:export") ? <ExportLinks /> : null}
    >
      <Tabs
        tabs={[
          { href: "/stock", label: "By item", active: view === "items" },
          { href: "/stock?view=events", label: "By event", active: view === "events" },
        ]}
      />

      {view === "items" ? <ItemsView /> : <EventsView />}
    </PageShell>
  );
}

async function ItemsView() {
  const items = await getStockByItem();
  if (items.length === 0) return <p className={emptyClass}>No items yet.</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.id} className={`${cardClass} space-y-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <p className="truncate font-semibold">{i.name}</p>
              <span className={i.hasSerial ? pillBlue : pillGray}>{i.hasSerial ? "Serial numbers" : "Bulk"}</span>
            </div>
            <p className="text-right">
              <span className="text-4xl font-bold tabular-nums tracking-tight">{i.inStock}</span>
              <span className="block text-xs text-muted">in stock</span>
            </p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${i.received > 0 ? Math.round((i.inStock / i.received) * 100) : 0}%` }} />
          </div>
          <p className="text-xs text-muted">{i.received} received · {i.distributed} given out</p>
        </div>
      ))}
    </div>
  );
}

async function EventsView() {
  const events = await getStockByEvent();
  if (events.length === 0) return <p className={emptyClass}>No events yet.</p>;
  return (
    <div className="space-y-4">
      {events.map((e) => (
        <div key={e.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="font-semibold">{e.name}</p>
            <span className="text-xs text-muted">{e.academicYear}</span>
          </div>
          {e.rows.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {e.rows.map((r) => (
                <li key={r.item} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium">{r.item}</span>
                  <span className="tabular-nums text-success" title="Received">+{r.received}</span>
                  <span className="tabular-nums text-primary" title="Given out">−{r.distributed}</span>
                  <span className="w-14 text-right font-semibold tabular-nums" title="Left from this event">{r.received - r.distributed}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
