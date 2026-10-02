import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import ActionForm from "@/components/action-form";
import ActivityFeed from "@/components/activity-feed";
import PageShell from "@/components/page-shell";
import { cardClass, sectionTitleClass } from "../../ui";
import { receiveGoods } from "./actions";
import ReceiveFields from "./receive-fields";

export default async function ReceivePage() {
  const user = await requirePermission("records:create");
  const [events, items, recent] = await Promise.all([
    prisma.event.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.item.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.receipt.findMany({ where: { deletedAt: null }, orderBy: { receivedAt: "desc" }, take: 5, include: { item: true } }),
  ]);
  const ready = events.length > 0 && items.length > 0;

  return (
    <PageShell title="Receive goods" description="Log what arrived and who it came from.">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {ready ? (
          <section className={cardClass}>
            <ActionForm action={receiveGoods} submitLabel="Record goods" className="space-y-5">
              <ReceiveFields
                events={events.map((e) => ({ id: e.id, label: `${e.name} (${e.academicYear})` }))}
                items={items.map((i) => ({ id: i.id, name: i.name, hasSerial: i.hasSerial }))}
              />
            </ActionForm>
          </section>
        ) : (
          <section className={`${cardClass} text-sm text-muted`}>
            An event and an item must exist first.{" "}
            {can(user.role, "catalogue:manage") ? (
              <Link href="/events" className="font-medium text-primary hover:underline">Open Setup</Link>
            ) : (
              "Ask an officer to add them."
            )}
          </section>
        )}
        <aside className="space-y-3">
          <h2 className={sectionTitleClass}>Just received</h2>
          <ActivityFeed
            empty="Nothing yet."
            items={recent.map((r) => ({ id: r.id, kind: "in" as const, title: `${r.quantity} × ${r.item.name}`, sub: `from ${r.receivedFrom}`, when: r.receivedAt }))}
          />
        </aside>
      </div>
    </PageShell>
  );
}
