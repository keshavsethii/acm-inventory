import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import PageShell from "@/components/page-shell";
import SerialChips from "@/components/serial-chips";
import { buttonClass, cardClass, emptyClass, inputClass, labelClass, pillBlue, pillGreen, sectionTitleClass, tableClass, tdClass, thClass } from "../../ui";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LIMIT = 100;

function dayStart(value: string) {
  const d = new Date(`${value}T00:00:00+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
function dayEnd(value: string) {
  const d = new Date(`${value}T23:59:59.999+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function Count({ n, capped }: { n: number; capped?: boolean }) {
  return <span className="font-normal text-muted">({n}{capped ? "+" : ""})</span>;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser();
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const eventId = one(sp.event);
  const itemId = one(sp.item);
  const typeId = one(sp.type);
  const from = DATE.test(one(sp.from)) ? one(sp.from) : "";
  const to = DATE.test(one(sp.to)) ? one(sp.to) : "";
  const filterCount = [eventId, itemId, typeId, from, to].filter(Boolean).length;
  const searching = Boolean(q) || filterCount > 0;

  const [events, items, types] = await Promise.all([
    prisma.event.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.item.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.recipientType.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const text = { contains: q, mode: "insensitive" as const };
  const gte = from ? dayStart(from) : undefined;
  const lte = to ? dayEnd(to) : undefined;
  const range = gte || lte ? { gte, lte } : undefined;

  const distWhere: Prisma.DistributionWhereInput = {
    deletedAt: null,
    ...(eventId ? { eventId } : {}),
    ...(itemId ? { itemId } : {}),
    ...(typeId ? { recipientTypeId: typeId } : {}),
    ...(range ? { distributedAt: range } : {}),
    ...(q
      ? {
          OR: [
            { recipientName: text }, { rollNumber: text }, { remarks: text },
            { item: { name: text } }, { event: { name: text } }, { serials: { some: { serialNumber: text } } },
          ],
        }
      : {}),
  };
  const recWhere: Prisma.ReceiptWhereInput = {
    deletedAt: null,
    ...(eventId ? { eventId } : {}),
    ...(itemId ? { itemId } : {}),
    ...(range ? { receivedAt: range } : {}),
    ...(q
      ? {
          OR: [
            { receivedFrom: text }, { remarks: text },
            { item: { name: text } }, { event: { name: text } }, { serials: { some: { serialNumber: text } } },
          ],
        }
      : {}),
  };
  const serialWhere: Prisma.SerialUnitWhereInput = {
    receipt: { deletedAt: null },
    serialNumber: text,
    ...(itemId ? { itemId } : {}),
  };

  const [serials, distributions, receipts] = searching
    ? await Promise.all([
        q
          ? prisma.serialUnit.findMany({
              where: serialWhere,
              orderBy: { serialNumber: "asc" },
              take: 30,
              include: { item: true, receipt: { include: { event: true } }, distribution: { include: { event: true, recipientType: true } } },
            })
          : Promise.resolve([]),
        prisma.distribution.findMany({
          where: distWhere,
          orderBy: { distributedAt: "desc" },
          take: LIMIT,
          include: { event: true, item: true, recipientType: true, serials: { select: { serialNumber: true } } },
        }),
        typeId
          ? Promise.resolve([])
          : prisma.receipt.findMany({
              where: recWhere,
              orderBy: { receivedAt: "desc" },
              take: LIMIT,
              include: { event: true, item: true, serials: { select: { serialNumber: true } } },
            }),
      ])
    : [[], [], []];

  const total = serials.length + distributions.length + receipts.length;

  return (
    <PageShell
      eyebrow="Find"
      title="Search"
      description="Look up a serial number to see exactly who received that unit, or search by name, roll number, source or remarks."
    >
      <form method="get" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              maxLength={100}
              autoFocus
              placeholder="Serial number, name, roll number, source..."
              className={`${inputClass} py-3.5 pl-11 text-base`}
            />
          </div>
          <button type="submit" className={`${buttonClass} px-8 py-3.5`}>Search</button>
        </div>

        <details open={filterCount > 0} className="group rounded-2xl border border-line bg-surface">
          <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-medium">
            <span>
              Filters
              {filterCount > 0 && <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{filterCount} active</span>}
            </span>
            <span aria-hidden className="text-muted transition group-open:rotate-180">⌄</span>
          </summary>
          <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className={labelClass}>Event</label>
              <select name="event" defaultValue={eventId} className={inputClass}>
                <option value="">Any event</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.academicYear})</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Item</label>
              <select name="item" defaultValue={itemId} className={inputClass}>
                <option value="">Any item</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Recipient type</label>
              <select name="type" defaultValue={typeId} className={inputClass}>
                <option value="">Any type</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>From date</label>
              <input name="from" type="date" defaultValue={from} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>To date</label>
              <input name="to" type="date" defaultValue={to} className={inputClass} />
            </div>
          </div>
        </details>
        {searching && <a href="/search" className="inline-block text-sm text-muted underline hover:text-foreground">Clear search</a>}
      </form>

      {!searching && (
        <p className={emptyClass}>
          Start typing above. Searching for a serial number shows the item, where it came from and who it was given to.
        </p>
      )}
      {searching && total === 0 && <p className={emptyClass}>No results. Try fewer words or remove a filter.</p>}

      {serials.length > 0 && (
        <section className="space-y-3">
          <h2 className={sectionTitleClass}>Serial numbers <Count n={serials.length} /></h2>
          <div className="grid gap-4 md:grid-cols-2">
            {serials.map((u) => (
              <div key={u.id} className={`${cardClass} space-y-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-semibold">{u.serialNumber}</p>
                    <p className="text-sm text-muted">{u.item.name}</p>
                  </div>
                  <span className={u.status === "IN_STOCK" ? pillGreen : pillBlue}>{u.status === "IN_STOCK" ? "In stock" : "Distributed"}</span>
                </div>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Received</dt>
                    <dd>{u.receipt.event.name} · from {u.receipt.receivedFrom}<br /><span className="text-muted">{formatDateTime(u.receipt.receivedAt)}</span></dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Given to</dt>
                    <dd>
                      {u.distribution ? (
                        <>
                          {[u.distribution.recipientName, u.distribution.rollNumber, u.distribution.recipientType?.name].filter(Boolean).join(" · ")}
                          <br /><span className="text-muted">{u.distribution.event.name} · {formatDateTime(u.distribution.distributedAt)}</span>
                        </>
                      ) : (
                        <span className="text-muted">Still in stock</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      {distributions.length > 0 && (
        <section className="space-y-3">
          <h2 className={sectionTitleClass}>Distributions <Count n={distributions.length} capped={distributions.length === LIMIT} /></h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>When</th><th className={thClass}>Item</th><th className={thClass}>Qty / serials</th>
                  <th className={thClass}>Recipient</th><th className={thClass}>Event</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((d) => (
                  <tr key={d.id}>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(d.distributedAt)}</td>
                    <td className={tdClass}>{d.item.name}</td>
                    <td className={tdClass}>{d.serials.length ? <SerialChips serials={d.serials.map((s) => s.serialNumber)} limit={3} /> : d.quantity}</td>
                    <td className={tdClass}>
                      {[d.recipientName, d.rollNumber, d.recipientType?.name].filter(Boolean).join(" · ") || <span className="text-muted">-</span>}
                      {d.remarks && <p className="text-xs text-muted">{d.remarks}</p>}
                    </td>
                    <td className={tdClass}>{d.event.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {receipts.length > 0 && (
        <section className="space-y-3">
          <h2 className={sectionTitleClass}>Goods received <Count n={receipts.length} capped={receipts.length === LIMIT} /></h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>When</th><th className={thClass}>Item</th><th className={thClass}>Qty / serials</th>
                  <th className={thClass}>From</th><th className={thClass}>Event</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(r.receivedAt)}</td>
                    <td className={tdClass}>{r.item.name}</td>
                    <td className={tdClass}>{r.serials.length ? <SerialChips serials={r.serials.map((s) => s.serialNumber)} limit={3} /> : r.quantity}</td>
                    <td className={tdClass}>
                      {r.receivedFrom}
                      {r.remarks && <p className="text-xs text-muted">{r.remarks}</p>}
                    </td>
                    <td className={tdClass}>{r.event.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PageShell>
  );
}
