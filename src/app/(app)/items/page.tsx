import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import ActionForm from "@/components/action-form";
import { cardClass, inputClass, labelClass } from "../../ui";
import { addRecipientType, removeItem, saveItem, toggleRecipientType } from "./actions";
import PageShell from "@/components/page-shell";

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
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input type="checkbox" name="hasSerial" defaultChecked={props.hasSerial} disabled={props.locked} />
        Has serial numbers
        {props.locked && <span className="text-xs text-muted/60">(locked: goods already received)</span>}
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
      <div className="space-y-6">
        <section className={cardClass}>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Add an item</h2>
          <ActionForm action={saveItem} submitLabel="Add item">
            <ItemFields />
          </ActionForm>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">All items ({items.length})</h2>
          {items.length === 0 && <p className="text-sm text-muted">No items yet.</p>}
          {items.map((i) => (
            <div key={i.id} className={cardClass}>
              <ActionForm action={saveItem} submitLabel="Save">
                <ItemFields id={i.id} name={i.name} description={i.description} hasSerial={i.hasSerial} locked={used.has(i.id)} />
              </ActionForm>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-danger">Remove item</summary>
                <div className="mt-2">
                  <ActionForm action={removeItem} submitLabel="Confirm remove">
                    <input type="hidden" name="id" value={i.id} />
                    <p className="text-muted">Only possible when the item has no records.</p>
                  </ActionForm>
                </div>
              </details>
            </div>
          ))}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recipient types</h2>
        <p className="text-sm text-muted">These fill the dropdown on the Distribute form. Hiding one keeps old records intact.</p>
        <div className={cardClass}>
          <ActionForm action={addRecipientType} submitLabel="Add type" className="flex flex-wrap items-end gap-3">
            <div>
              <label className={labelClass}>New type (e.g. Guest, Judge)</label>
              <input name="name" required maxLength={40} className={inputClass} />
            </div>
          </ActionForm>
        </div>
        <ul className="space-y-2">
          {types.map((t) => (
            <li key={t.id} className={`${cardClass} flex items-center justify-between py-2`}>
              <span className={t.isActive ? "" : "text-muted/60 line-through"}>{t.name}</span>
              <form action={toggleRecipientType.bind(null, t.id)}>
                <button className="text-sm underline">{t.isActive ? "Hide" : "Show"}</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
