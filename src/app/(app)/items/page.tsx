import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import ActionForm from "@/components/action-form";
import ExpandableRow from "@/components/expandable-row";
import PageShell from "@/components/page-shell";
import { cardClass, emptyClass, inputClass, labelClass, pillBlue, pillGray, sectionTitleClass, smallButton } from "../../ui";
import { addRecipientType, removeItem, saveItem, toggleRecipientType } from "./actions";

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
  const [items, types, receiptCounts] = await Promise.all([
    prisma.item.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.recipientType.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.receipt.groupBy({ by: ["itemId"], _count: true }),
  ]);
  const used = new Set(receiptCounts.map((r) => r.itemId));

  return (
    <PageShell eyebrow="Catalogue" title="Items" description="What the chapter keeps track of, and which items carry serial numbers.">
      <section className={cardClass}>
        <h2 className={`${sectionTitleClass} mb-4`}>Add an item</h2>
        <ActionForm action={saveItem} submitLabel="Add item">
          <ItemFields />
        </ActionForm>
      </section>

      <section className="space-y-3">
        <h2 className={sectionTitleClass}>All items <span className="font-normal text-muted">({items.length})</span></h2>
        {items.length === 0 && <p className={emptyClass}>No items yet. Add the first one above.</p>}
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
                    <p className="text-sm text-muted">Removing is only possible when the item has no records.</p>
                  </ActionForm>
                ),
              },
            ]}
          />
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className={sectionTitleClass}>Recipient types</h2>
          <p className="mt-1 text-sm text-muted">These fill the dropdown on the Distribute form. Hiding one keeps old records intact.</p>
        </div>
        <div className={cardClass}>
          <ActionForm action={addRecipientType} submitLabel="Add type">
            <div className="max-w-sm">
              <label className={labelClass}>New type (for example Guest or Judge)</label>
              <input name="name" required maxLength={40} className={inputClass} />
            </div>
          </ActionForm>
        </div>
        <ul className="space-y-2">
          {types.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-3">
              <span className={t.isActive ? "font-medium" : "text-muted line-through"}>{t.name}</span>
              <form action={toggleRecipientType.bind(null, t.id)}>
                <button className={smallButton()}>{t.isActive ? "Hide" : "Show"}</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
