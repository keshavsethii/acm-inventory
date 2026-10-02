import Link from "next/link";

// Simple segmented tabs made of links (the active one is chosen by the page).
export default function Tabs({ tabs }: { tabs: { href: string; label: string; active: boolean }[] }) {
  return (
    <div className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${t.active ? "bg-primary/15 text-primary" : "text-muted hover:text-foreground"}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function SetupTabs({ current }: { current: "events" | "items" | "types" }) {
  return (
    <Tabs
      tabs={[
        { href: "/events", label: "Events", active: current === "events" },
        { href: "/items", label: "Items", active: current === "items" },
        { href: "/types", label: "Recipient types", active: current === "types" },
      ]}
    />
  );
}
