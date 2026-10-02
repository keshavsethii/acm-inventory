import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { getStockByItem } from "@/lib/stock";
import PageShell from "@/components/page-shell";
import { cardClass, eyebrowClass } from "../ui";

const ACTIONS = [
  { href: "/receive", eyebrow: "Stock in", title: "Receive goods", text: "Record items that arrive for an event." },
  { href: "/distribute", eyebrow: "Stock out", title: "Distribute goods", text: "Hand items to winners, participants and organizers." },
  { href: "/search", eyebrow: "Find", title: "Search", text: "Look up a serial number, person or roll number." },
  { href: "/stock", eyebrow: "Overview", title: "Stock", text: "What came in, what went out and what is left." },
];

export default async function Dashboard() {
  const user = await requireUser();
  const stock = await getStockByItem();
  const received = stock.reduce((sum, i) => sum + i.received, 0);
  const distributed = stock.reduce((sum, i) => sum + i.distributed, 0);
  const tiles = [
    ["Items tracked", stock.length],
    ["Units received", received],
    ["Units distributed", distributed],
    ["Units in stock", received - distributed],
  ];

  return (
    <PageShell eyebrow={ROLE_LABELS[user.role]} title={`Welcome, ${user.name}`} description="Everything the chapter has received and given out, in one place.">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label} className={cardClass}>
            <p className="text-4xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className={`group ${cardClass} transition hover:border-primary/60 hover:bg-surface-2`}>
            <p className={eyebrowClass}>{a.eyebrow}</p>
            <p className="mt-2 flex items-center justify-between text-xl font-semibold">
              {a.title}
              <span aria-hidden className="text-muted transition group-hover:translate-x-1 group-hover:text-primary">→</span>
            </p>
            <p className="mt-2 text-sm text-muted">{a.text}</p>
          </Link>
        ))}
      </section>

    </PageShell>
  );
}
