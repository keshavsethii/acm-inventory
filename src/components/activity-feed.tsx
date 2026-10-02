import { formatShort } from "@/lib/format";
import { emptyClass } from "@/app/ui";
import Icon from "./icon";

export type FeedItem = { id: string; kind: "in" | "out"; title: string; sub: string; when: Date };

// Compact list of recent movements: green arrow = came in, blue arrow = went out.
export default function ActivityFeed({ items, empty }: { items: FeedItem[]; empty: string }) {
  if (items.length === 0) return <p className={emptyClass}>{empty}</p>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {items.map((i) => (
        <li key={i.id} className="flex items-center gap-3 px-4 py-3">
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${i.kind === "in" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}`}>
            <Icon name={i.kind === "in" ? "receive" : "distribute"} size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{i.title}</p>
            <p className="truncate text-xs text-muted">{i.sub}</p>
          </div>
          <span className="shrink-0 text-xs text-muted">{formatShort(i.when)}</span>
        </li>
      ))}
    </ul>
  );
}
