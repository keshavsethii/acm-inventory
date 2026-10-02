import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getStockByItem } from "@/lib/stock";
import ActivityFeed, { type FeedItem } from "@/components/activity-feed";
import Icon from "@/components/icon";
import { emptyClass, inputClass, sectionTitleClass } from "../ui";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function Tile(props: { href: string; icon: "receive" | "distribute"; title: string; text: string; tone: "success" | "primary" }) {
  const glow =
    props.tone === "success"
      ? "bg-[linear-gradient(135deg,color-mix(in_oklab,var(--success)_16%,transparent),transparent_70%)]"
      : "bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_70%)]";
  const chip = props.tone === "success" ? "bg-success/15 text-success" : "bg-primary/15 text-primary";
  return (
    <Link href={props.href} className={`group flex items-center gap-5 rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-0.5 hover:border-primary/50 ${glow}`}>
      <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${chip}`}>
        <Icon name={props.icon} size={26} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-semibold tracking-tight">{props.title}</span>
        <span className="block text-sm text-muted">{props.text}</span>
      </span>
      <Icon name="arrow" className="text-muted transition group-hover:translate-x-1 group-hover:text-foreground" />
    </Link>
  );
}

export default async function Dashboard() {
  const user = await requireUser();
  const [stock, receipts, distributions] = await Promise.all([
    getStockByItem(),
    prisma.receipt.findMany({ where: { deletedAt: null }, orderBy: { receivedAt: "desc" }, take: 6, include: { item: true } }),
    prisma.distribution.findMany({ where: { deletedAt: null }, orderBy: { distributedAt: "desc" }, take: 6, include: { item: true } }),
  ]);

  const feed: FeedItem[] = [
    ...receipts.map((r) => ({ id: `r${r.id}`, kind: "in" as const, title: `${r.quantity} × ${r.item.name}`, sub: `from ${r.receivedFrom}`, when: r.receivedAt })),
    ...distributions.map((d) => ({ id: `d${d.id}`, kind: "out" as const, title: `${d.quantity} × ${d.item.name}`, sub: d.recipientName ? `to ${d.recipientName}` : "no recipient recorded", when: d.distributedAt })),
  ]
    .sort((a, b) => b.when.getTime() - a.when.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-muted">{greeting()}</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{user.name.split(" ")[0]}</h1>
      </header>

      <form action="/search" method="get" role="search" className="relative">
        <Icon name="search" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          name="q"
          maxLength={100}
          placeholder="Find a serial number, a name or a roll number"
          className={`${inputClass} rounded-2xl py-4 pl-14 text-base`}
        />
      </form>

      <section className="grid gap-4 sm:grid-cols-2">
        <Tile href="/receive" icon="receive" tone="success" title="Receive goods" text="Log what just arrived" />
        <Tile href="/distribute" icon="distribute" tone="primary" title="Distribute goods" text="Give items to winners and participants" />
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className={sectionTitleClass}>In stock</h2>
            <Link href="/stock" className="text-sm text-primary hover:underline">All stock</Link>
          </div>
          {stock.length === 0 ? (
            <p className={emptyClass}>No items yet. An officer can add them under Setup.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {stock.slice(0, 6).map((i) => (
                <li key={i.id} className="px-4 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">{i.name}</span>
                    <span className="text-lg font-semibold tabular-nums">{i.inStock}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${i.received > 0 ? Math.round((i.inStock / i.received) * 100) : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h2 className={sectionTitleClass}>Recent activity</h2>
          <ActivityFeed items={feed} empty="Nothing yet. Receive some goods to get started." />
        </div>
      </section>
    </div>
  );
}
