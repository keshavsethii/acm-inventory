import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import ActionForm from "@/components/action-form";
import { cardClass, inputClass, labelClass } from "../../ui";
import { deleteDistribution, deleteReceipt, updateDistribution, updateReceipt } from "./actions";

type Option = { id: string; label: string };

function Select(props: { name: string; value: string; options: Option[]; allowNone?: boolean; required?: boolean }) {
  return (
    <select name={props.name} defaultValue={props.value} required={props.required} className={inputClass}>
      {props.allowNone && <option value="">None</option>}
      {props.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
}

function DeleteForm(props: { id: string; action: typeof deleteReceipt; hint: string }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-red-700">Delete</summary>
      <div className="mt-2 max-w-md">
        <p className="mb-2 text-zinc-500">{props.hint}</p>
        <ActionForm action={props.action} submitLabel="Confirm delete">
          <input type="hidden" name="id" value={props.id} />
          <div>
            <label className={labelClass}>Reason</label>
            <input name="reason" required minLength={3} maxLength={200} className={inputClass} />
          </div>
        </ActionForm>
      </div>
    </details>
  );
}

export default async function RecordsPage() {
  const user = await requireUser();
  const canEdit = can(user.role, "records:edit");
  const canDelete = can(user.role, "records:delete");

  const [events, types, receipts, distributions] = await Promise.all([
    prisma.event.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.recipientType.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.receipt.findMany({
      where: { deletedAt: null },
      orderBy: { receivedAt: "desc" },
      take: 50,
      include: { event: true, item: true, createdBy: true, serials: { select: { serialNumber: true } } },
    }),
    prisma.distribution.findMany({
      where: { deletedAt: null },
      orderBy: { distributedAt: "desc" },
      take: 50,
      include: { event: true, item: true, recipientType: true, createdBy: true, serials: { select: { serialNumber: true } } },
    }),
  ]);
  const eventOptions = events.map((e) => ({ id: e.id, label: `${e.name} (${e.academicYear})` }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Records</h1>
        <p className="text-sm text-zinc-500">
          Latest 50 of each. {canEdit ? "Deleted records are kept in the audit log, never erased." : "Only officers can edit or delete records."}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Goods received</h2>
        {receipts.length === 0 && <p className="text-sm text-zinc-500">Nothing received yet.</p>}
        {receipts.map((r) => (
          <div key={r.id} className={`${cardClass} space-y-2`}>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span><b>{r.quantity} x {r.item.name}</b> from {r.receivedFrom}</span>
              <span className="text-zinc-500">{r.event.name} · {formatDateTime(r.receivedAt)} · {r.createdBy.name}</span>
            </div>
            {r.serials.length > 0 && <p className="break-words font-mono text-xs text-zinc-600">{r.serials.map((s) => s.serialNumber).join(", ")}</p>}
            {r.remarks && <p className="text-sm text-zinc-600">Remarks: {r.remarks}</p>}
            {canEdit && (
              <details className="text-sm">
                <summary className="cursor-pointer underline">Edit</summary>
                <div className="mt-2 max-w-2xl">
                  <ActionForm action={updateReceipt} submitLabel="Save changes">
                    <input type="hidden" name="id" value={r.id} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><label className={labelClass}>Event</label><Select name="eventId" value={r.eventId} options={eventOptions} required /></div>
                      <div><label className={labelClass}>Received from</label><input name="receivedFrom" defaultValue={r.receivedFrom} required maxLength={120} className={inputClass} /></div>
                      {!r.item.hasSerial && (
                        <div><label className={labelClass}>Quantity</label><input name="quantity" type="number" min={1} defaultValue={r.quantity} className={inputClass} /></div>
                      )}
                      <div><label className={labelClass}>Remarks</label><input name="remarks" defaultValue={r.remarks ?? ""} maxLength={500} className={inputClass} /></div>
                    </div>
                  </ActionForm>
                </div>
              </details>
            )}
            {canDelete && (
              <DeleteForm id={r.id} action={deleteReceipt} hint="Removes this receipt from stock. Not allowed if any of these units were already given out." />
            )}
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Goods distributed</h2>
        {distributions.length === 0 && <p className="text-sm text-zinc-500">Nothing distributed yet.</p>}
        {distributions.map((d) => {
          const typeOptions = types.filter((t) => t.isActive || t.id === d.recipientTypeId).map((t) => ({ id: t.id, label: t.name }));
          return (
            <div key={d.id} className={`${cardClass} space-y-2`}>
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span>
                  <b>{d.quantity} x {d.item.name}</b> to{" "}
                  {[d.recipientName, d.rollNumber, d.recipientType?.name].filter(Boolean).join(" · ") || "no recipient recorded"}
                </span>
                <span className="text-zinc-500">{d.event.name} · {formatDateTime(d.distributedAt)} · {d.createdBy.name}</span>
              </div>
              {d.serials.length > 0 && <p className="break-words font-mono text-xs text-zinc-600">{d.serials.map((s) => s.serialNumber).join(", ")}</p>}
              {d.remarks && <p className="text-sm text-zinc-600">Remarks: {d.remarks}</p>}
              {canEdit && (
                <details className="text-sm">
                  <summary className="cursor-pointer underline">Edit</summary>
                  <div className="mt-2 max-w-2xl">
                    <ActionForm action={updateDistribution} submitLabel="Save changes">
                      <input type="hidden" name="id" value={d.id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><label className={labelClass}>Event</label><Select name="eventId" value={d.eventId} options={eventOptions} required /></div>
                        <div><label className={labelClass}>Recipient type</label><Select name="recipientTypeId" value={d.recipientTypeId ?? ""} options={typeOptions} allowNone required={d.item.hasSerial} /></div>
                        <div><label className={labelClass}>Recipient name</label><input name="recipientName" defaultValue={d.recipientName ?? ""} required={d.item.hasSerial} maxLength={120} className={inputClass} /></div>
                        <div><label className={labelClass}>Roll number</label><input name="rollNumber" defaultValue={d.rollNumber ?? ""} maxLength={40} className={inputClass} /></div>
                        {!d.item.hasSerial && (
                          <div><label className={labelClass}>Quantity</label><input name="quantity" type="number" min={1} defaultValue={d.quantity} className={inputClass} /></div>
                        )}
                        <div><label className={labelClass}>Remarks</label><input name="remarks" defaultValue={d.remarks ?? ""} maxLength={500} className={inputClass} /></div>
                      </div>
                    </ActionForm>
                  </div>
                </details>
              )}
              {canDelete && (
                <DeleteForm id={d.id} action={deleteDistribution} hint="Undoes this distribution. The units go back into stock." />
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
