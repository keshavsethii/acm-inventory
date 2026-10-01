import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { buttonClass, cardClass, inputClass, labelClass, tableClass, tdClass, thClass } from "../../ui";

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

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser();
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const eventId = one(sp.event);
  const itemId = one(sp.item);
  const typeId = one(sp.type);
  const from = DATE.test(one(sp.from)) ? one(sp.from) : "";
  const to = DATE.test(one(sp.to)) ? one(sp.to) : "";
  const searching = Boolean(q || eventId || itemId || typeId || from || to);

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
              take: 50,
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Search</h1>

      <form method="get" className={`${cardClass} space-y-3`}>
        <div>
          <label className={labelClass}>Search for a serial number, person, roll number, source, remarks...</label>
          <input name="q" defaultValue={q} maxLength={100} autoFocus className={inputClass} />
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          <div>
            <label className={labelClass}>Event</label>
            <select name="event" defaultValue={eventId} className={inputClass}>
              <option value="">Any</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.academicYear})</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Item</label>
            <select name="item" defaultValue={itemId} className={inputClass}>
              <option value="">Any</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Recipient type</label>
            <select name="type" defaultValue={typeId} className={inputClass}>
              <option value="">Any</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>From</label>
            <input name="from" type="date" defaultValue={from} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>To</label>
            <input name="to" type="date" defaultValue={to} className={inputClass} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className={buttonClass}>Search</button>
          <a href="/search" className="text-sm underline">Clear</a>
        </div>
      </form>

      {!searching && <p className="text-sm text-zinc-500">Type something or pick a filter. A serial number search shows exactly who received that unit.</p>}

      {searching && q && (
        <section>
          <h2 className="mb-2 font-medium">Serial numbers ({serials.length})</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Serial</th><th className={thClass}>Item</th><th className={thClass}>Status</th>
                  <th className={thClass}>Received</th><th className={thClass}>Given to</th>
                </tr>
              </thead>
              <tbody>
                {serials.length === 0 && <tr><td className={tdClass} colSpan={5}>No serial number matches.</td></tr>}
                {serials.map((u) => (
                  <tr key={u.id}>
                    <td className={`${tdClass} font-mono`}>{u.serialNumber}</td>
                    <td className={tdClass}>{u.item.name}</td>
                    <td className={tdClass}>{u.status === "IN_STOCK" ? "In stock" : "Distributed"}</td>
                    <td className={tdClass}>{u.receipt.event.name}, from {u.receipt.receivedFrom}<br /><span className="text-zinc-500">{formatDateTime(u.receipt.receivedAt)}</span></td>
                    <td className={tdClass}>
                      {u.distribution ? (
                        <>
                          {[u.distribution.recipientName, u.distribution.rollNumber, u.distribution.recipientType?.name].filter(Boolean).join(" · ")}
                          <br /><span className="text-zinc-500">{u.distribution.event.name}, {formatDateTime(u.distribution.distributedAt)}</span>
                        </>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {searching && (
        <section>
          <h2 className="mb-2 font-medium">Distributions ({distributions.length}{distributions.length === LIMIT ? "+, showing the latest 100" : ""})</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>When</th><th className={thClass}>Event</th><th className={thClass}>Item</th>
                  <th className={thClass}>Qty / serials</th><th className={thClass}>To</th><th className={thClass}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {distributions.length === 0 && <tr><td className={tdClass} colSpan={6}>No distributions match.</td></tr>}
                {distributions.map((d) => (
                  <tr key={d.id}>
                    <td className={tdClass}>{formatDateTime(d.distributedAt)}</td>
                    <td className={tdClass}>{d.event.name}</td>
                    <td className={tdClass}>{d.item.name}</td>
                    <td className={tdClass}>{d.serials.length ? d.serials.map((s) => s.serialNumber).join(", ") : d.quantity}</td>
                    <td className={tdClass}>{[d.recipientName, d.rollNumber, d.recipientType?.name].filter(Boolean).join(" · ") || "-"}</td>
                    <td className={tdClass}>{d.remarks ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {searching && !typeId && (
        <section>
          <h2 className="mb-2 font-medium">Goods received ({receipts.length}{receipts.length === LIMIT ? "+, showing the latest 100" : ""})</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>When</th><th className={thClass}>Event</th><th className={thClass}>Item</th>
                  <th className={thClass}>Qty / serials</th><th className={thClass}>From</th><th className={thClass}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 && <tr><td className={tdClass} colSpan={6}>No receipts match.</td></tr>}
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td className={tdClass}>{formatDateTime(r.receivedAt)}</td>
                    <td className={tdClass}>{r.event.name}</td>
                    <td className={tdClass}>{r.item.name}</td>
                    <td className={tdClass}>{r.serials.length ? r.serials.map((s) => s.serialNumber).join(", ") : r.quantity}</td>
                    <td className={tdClass}>{r.receivedFrom}</td>
                    <td className={tdClass}>{r.remarks ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
