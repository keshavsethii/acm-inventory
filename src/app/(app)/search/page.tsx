import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatShort } from "@/lib/format";
import Facts from "@/components/facts";
import Icon from "@/components/icon";
import PageShell from "@/components/page-shell";
import RecordRow from "@/components/record-row";
import SerialChips from "@/components/serial-chips";
import Tabs from "@/components/tabs";
import { buttonClass, emptyClass, inputClass, labelClass, pillBlue, pillGreen, smallButton } from "../../ui";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LIMIT = 50;
const PREVIEW = 5;

function dayStart(value: string) {
  const d = new Date(`${value}T00:00:00+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
function dayEnd(value: string) {
  const d = new Date(`${value}T23:59:59.999+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
const countLabel = (n: number) => (n >= LIMIT ? `${LIMIT}+` : String(n));

function Section(props: { title: string; count: number; shown: number; seeAllHref?: string; children: React.ReactNode }) {
  if (props.count === 0) return null;
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{props.title}</h2>
        {props.seeAllHref && props.count > props.shown && (
          <Link href={props.seeAllHref} className="text-sm text-primary hover:underline">See all {countLabel(props.count)}</Link>
        )}
      </div>
      {props.children}
    </section>
  );
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
  const tabParam = one(sp.tab);
  const tab = ["serials", "given", "received"].includes(tabParam) ? tabParam : "all";
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

  const [serials, given, received] = searching
    ? await Promise.all([
        q
          ? prisma.serialUnit.findMany({
              where: serialWhere,
              orderBy: { serialNumber: "asc" },
              take: LIMIT,
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

  const total = serials.length + given.length + received.length;

  // Links keep the current search and filters, and only change the tab.
  const base = new URLSearchParams();
  if (q) base.set("q", q);
  if (eventId) base.set("event", eventId);
  if (itemId) base.set("item", itemId);
  if (typeId) base.set("type", typeId);
  if (from) base.set("from", from);
  if (to) base.set("to", to);
  const link = (t: string) => {
    const p = new URLSearchParams(base);
    if (t !== "all") p.set("tab", t);
    const qs = p.toString();
    return qs ? `/search?${qs}` : "/search";
  };

  const showSerials = tab === "all" || tab === "serials";
  const showGiven = tab === "all" || tab === "given";
  const showReceived = tab === "all" || tab === "received";
  const cap = (n: number) => (tab === "all" ? PREVIEW : n);

  const serialRows = serials.slice(0, cap(serials.length)).map((u) => {
    const who = u.distribution ? [u.distribution.recipientName, u.distribution.rollNumber].filter(Boolean).join(" · ") : "";
    return (
      <RecordRow
        key={u.id}
        kind="unit"
        title={<span className="font-mono">{u.serialNumber}</span>}
        subtitle={u.distribution ? `${u.item.name} · with ${who || "recipient"}` : `${u.item.name} · in stock`}
        side={<span className={u.status === "IN_STOCK" ? pillGreen : pillBlue}>{u.status === "IN_STOCK" ? "In stock" : "Given out"}</span>}
        details={
          <ol className="space-y-4 border-l border-line pl-5 text-sm">
            <li>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Received</p>
              <p>{u.receipt.event.name} · from {u.receipt.receivedFrom}</p>
              <p className="text-muted">{formatDateTime(u.receipt.receivedAt)}</p>
            </li>
            <li>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Given to</p>
              {u.distribution ? (
                <>
                  <p>{[u.distribution.recipientName, u.distribution.rollNumber, u.distribution.recipientType?.name].filter(Boolean).join(" · ")}</p>
                  <p className="text-muted">{u.distribution.event.name} · {formatDateTime(u.distribution.distributedAt)}</p>
                </>
              ) : (
                <p className="text-muted">Still in stock</p>
              )}
            </li>
          </ol>
        }
      />
    );
  });

  const givenRows = given.slice(0, cap(given.length)).map((d) => (
    <RecordRow
      key={d.id}
      kind="out"
      title={d.recipientName ?? "No recipient recorded"}
      subtitle={`${d.quantity} × ${d.item.name} · ${d.event.name}`}
      side={formatShort(d.distributedAt)}
      details={
        <div className="space-y-4">
          <Facts rows={[["Roll number", d.rollNumber ?? "-"], ["Type", d.recipientType?.name ?? "-"], ["Given", formatDateTime(d.distributedAt)], ["Remarks", d.remarks ?? "-"]]} />
          <SerialChips serials={d.serials.map((s) => s.serialNumber)} limit={12} />
        </div>
      }
    />
  ));

  const receivedRows = received.slice(0, cap(received.length)).map((r) => (
    <RecordRow
      key={r.id}
      kind="in"
      title={r.receivedFrom}
      subtitle={`${r.quantity} × ${r.item.name} · ${r.event.name}`}
      side={formatShort(r.receivedAt)}
      details={
        <div className="space-y-4">
          <Facts rows={[["Received", formatDateTime(r.receivedAt)], ["Event", r.event.name], ["Remarks", r.remarks ?? "-"]]} />
          <SerialChips serials={r.serials.map((s) => s.serialNumber)} limit={12} />
        </div>
      }
    />
  ));

  return (
    <PageShell title="Search" description="Find where a serial number went, or look someone up by name or roll number.">
      <form method="get" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Icon name="search" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              name="q"
              defaultValue={q}
              maxLength={100}
              autoFocus
              placeholder="Serial number, name, roll number, source..."
              className={`${inputClass} rounded-2xl py-4 pl-14 text-base`}
            />
          </div>
          <button type="submit" className={`${buttonClass} rounded-2xl px-8`}>Search</button>
        </div>

        <details open={filterCount > 0} className="group">
          <summary className={`${smallButton()} cursor-pointer gap-2`}>
            <Icon name="filter" size={14} />
            Filters
            {filterCount > 0 && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{filterCount}</span>}
          </summary>
          <div className="mt-3 grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-5">
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
        </details>
      </form>

      {!searching && (
        <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Icon name="search" size={22} /></span>
          <p className="font-medium">What are you looking for?</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Type a serial number to see who has it, or a name or roll number to see what they received.</p>
        </div>
      )}

      {searching && total === 0 && <p className={emptyClass}>No matches. Try fewer letters, or remove a filter.</p>}

      {searching && total > 0 && (
        <>
          <Tabs
            tabs={[
              { href: link("all"), label: "All", active: tab === "all" },
              ...(q ? [{ href: link("serials"), label: `Serials (${countLabel(serials.length)})`, active: tab === "serials" }] : []),
              { href: link("given"), label: `Given out (${countLabel(given.length)})`, active: tab === "given" },
              ...(!typeId ? [{ href: link("received"), label: `Received (${countLabel(received.length)})`, active: tab === "received" }] : []),
            ]}
          />
          <div className="space-y-8">
            {showSerials && <Section title="Serial numbers" seeAllHref={tab === "all" ? link("serials") : undefined} count={serials.length} shown={PREVIEW}>{serialRows}</Section>}
            {showGiven && <Section title="Given out" seeAllHref={tab === "all" ? link("given") : undefined} count={given.length} shown={PREVIEW}>{givenRows}</Section>}
            {showReceived && <Section title="Received" seeAllHref={tab === "all" ? link("received") : undefined} count={received.length} shown={PREVIEW}>{receivedRows}</Section>}
          </div>
        </>
      )}
    </PageShell>
  );
}
