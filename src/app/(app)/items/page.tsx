import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import ActionForm from "@/components/action-form";
import AddPanel from "@/components/add-panel";
import ExpandableRow from "@/components/expandable-row";
import PageShell from "@/components/page-shell";
import { SetupTabs } from "@/components/tabs";
import { emptyClass, inputClass, labelClass, pillBlue, pillGray } from "../../ui";
import { removeItem, saveItem } from "./actions";

function ItemFields(props: { id?: string; name?: string; description?: string | null; hasSerial?: boolean; locked?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      {props.id && <input type="hidden" name="id" value={props.id} />}
      <div>
        <label className={labelClass}>Item name</label>
        <input name="name" defaultValue={props.name} required maxLength={120} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Description (optional)</label>
        <input name="description" defaultValue={props.description ?? ""} maxLength={300} className={inputClass} />
      </div>
      <label className="flex items-center gap-2 pb-2.5 text-sm">
        <input type="checkbox" name="hasSerial" defaultChecked={props.hasSerial} disabled={props.locked} />
        Has serial numbers
        {props.locked && <span className="text-xs text-muted">(locked: goods already received)</span>}
      </label>
    </div>
  );
}

export default async function ItemsPage() {
  await requirePermission("catalogue:manage");
  const [items, receiptCounts] = await Promise.all([
    prisma.item.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.receipt.groupBy({ by: ["itemId"], _count: true }),
  ]);
  const used = new Set(receiptCounts.map((r) => r.itemId));

  return (
    <PageShell title="Setup" description="Events, items and recipient types used across the app.">
      <SetupTabs current="items" />

      <AddPanel label="New item">
        <ActionForm action={saveItem} submitLabel="Add item">
          <ItemFields />
        </ActionForm>
      </AddPanel>

      <section className="space-y-2.5">
        {items.length === 0 && <p className={emptyClass}>No items yet.</p>}
        {items.map((i) => (
          <ExpandableRow
            key={i.id}
            summary={
              <>
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {i.name}
                  <span className={i.hasSerial ? pillBlue : pillGray}>{i.hasSerial ? "Serial numbers" : "Bulk"}</span>
                </p>
                {i.description && <p className="mt-0.5 text-sm text-muted">{i.description}</p>}
              </>
            }
            actions={[
              {
                key: "edit",
                label: "Edit",
                panel: (
                  <ActionForm action={saveItem} submitLabel="Save changes">
                    <ItemFields id={i.id} name={i.name} description={i.description} hasSerial={i.hasSerial} locked={used.has(i.id)} />
                  </ActionForm>
                ),
              },
              {
                key: "remove",
                label: "Remove",
                tone: "danger",
                panel: (
                  <ActionForm action={removeItem} submitLabel="Remove item" tone="danger">
                    <input type="hidden" name="id" value={i.id} />
                    <p className="text-sm text-muted">Only possible when the item has no records.</p>
                  </ActionForm>
                ),
              },
            ]}
          />
        ))}
      </section>
    </PageShell>
  );
}
