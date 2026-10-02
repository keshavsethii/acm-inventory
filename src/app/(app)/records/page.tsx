import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import ActionForm from "@/components/action-form";
import ExpandableRow, { type RowAction } from "@/components/expandable-row";
import ExportLinks from "@/components/export-links";
import PageShell from "@/components/page-shell";
import SerialChips from "@/components/serial-chips";
import { emptyClass, inputClass, labelClass } from "../../ui";
import { deleteDistribution, deleteReceipt, updateDistribution, updateReceipt } from "./actions";

type Params = Record<string, string | string[] | undefined>;
type Option = { id: string; label: string };

function Select(props: { name: string; value: string; options: Option[]; allowNone?: boolean; required?: boolean }) {
  return (
    <select name={props.name} defaultValue={props.value} required={props.required} className={inputClass}>
      {props.allowNone && <option value="">None</option>}
      {props.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
}

function DeletePanel(props: { id: string; action: typeof deleteReceipt; hint: string }) {
  return (
    <ActionForm action={props.action} submitLabel="Delete record" tone="danger">
      <input type="hidden" name="id" value={props.id} />
      <p className="text-sm text-muted">{props.hint} The record is kept in the audit log.</p>
      <div className="max-w-md">
        <label className={labelClass}>Reason for deleting</label>
        <input name="reason" required minLength={3} maxLength={200} className={inputClass} />
      </div>
    </ActionForm>
  );
}

export default async function RecordsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await requireUser();
  const canEdit = can(user.role, "records:edit");
  const canDelete = can(user.role, "records:delete");
  const sp = await searchParams;
  const view = (Array.isArray(sp.view) ? sp.view[0] : sp.view) === "distributed" ? "distributed" : "received";

  const [events, types, receiptCount, distributionCount] = await Promise.all([
    prisma.event.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.recipientType.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.receipt.count({ where: { deletedAt: null } }),
    prisma.distribution.count({ where: { deletedAt: null } }),
  ]);
  const eventOptions = events.map((e) => ({ id: e.id, label: `${e.name} (${e.academicYear})` }));

  const receipts =
    view === "received"
      ? await prisma.receipt.findMany({
          where: { deletedAt: null },
          orderBy: { receivedAt: "desc" },
          take: 50,
          include: { event: true, item: true, createdBy: true, serials: { select: { serialNumber: true } } },
        })
      : [];
  const distributions =
    view === "distributed"
      ? await prisma.distribution.findMany({
          where: { deletedAt: null },
          orderBy: { distributedAt: "desc" },
          take: 50,
          include: { event: true, item: true, recipientType: true, createdBy: true, serials: { select: { serialNumber: true } } },
        })
      : [];

  const tab = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${active ? "bg-primary/15 text-primary" : "text-muted hover:text-foreground"}`;

  return (
    <PageShell
      eyebrow="History"
      title="Records"
      description="Everything that came in and went out. Deleted records are kept in the audit log, never erased."
      actions={can(user.role, "records:export") ? <ExportLinks /> : null}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1">
          <Link href="/records?view=received" className={tab(view === "received")}>Goods received ({receiptCount})</Link>
          <Link href="/records?view=distributed" className={tab(view === "distributed")}>Goods distributed ({distributionCount})</Link>
        </div>
        <p className="hidden text-sm text-muted sm:block">Latest 50 shown</p>
      </div>

      {view === "received" && (
        <section className="space-y-3">
          {receipts.length === 0 && <p className={emptyClass}>Nothing received yet.</p>}
          {receipts.map((r) => {
            const actions: RowAction[] = [];
            if (canEdit) {
              actions.push({
                key: "edit",
                label: "Edit",
                panel: (
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
                ),
              });
            }
            if (canDelete) {
              actions.push({
                key: "delete",
                label: "Delete",
                tone: "danger",
                panel: <DeletePanel id={r.id} action={deleteReceipt} hint="Removes this receipt from stock. Not allowed if any of these units were already given out." />,
              });
            }
            return (
              <ExpandableRow
                key={r.id}
                actions={actions}
                summary={
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {r.quantity} × {r.item.name} <span className="font-normal text-muted">from {r.receivedFrom}</span>
                    </p>
                    <p className="text-sm text-muted">{r.event.name} · {formatDateTime(r.receivedAt)} · by {r.createdBy.name}</p>
                    <SerialChips serials={r.serials.map((s) => s.serialNumber)} />
                    {r.remarks && <p className="text-sm text-muted">Remarks: {r.remarks}</p>}
                  </div>
                }
              />
            );
          })}
        </section>
      )}

      {view === "distributed" && (
        <section className="space-y-3">
          {distributions.length === 0 && <p className={emptyClass}>Nothing distributed yet.</p>}
          {distributions.map((d) => {
            const typeOptions = types.filter((t) => t.isActive || t.id === d.recipientTypeId).map((t) => ({ id: t.id, label: t.name }));
            const recipient = [d.recipientName, d.rollNumber, d.recipientType?.name].filter(Boolean).join(" · ");
            const actions: RowAction[] = [];
            if (canEdit) {
              actions.push({
                key: "edit",
                label: "Edit",
                panel: (
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
                ),
              });
            }
            if (canDelete) {
              actions.push({
                key: "delete",
                label: "Delete",
                tone: "danger",
                panel: <DeletePanel id={d.id} action={deleteDistribution} hint="Undoes this distribution. The units go back into stock." />,
              });
            }
            return (
              <ExpandableRow
                key={d.id}
                actions={actions}
                summary={
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {d.quantity} × {d.item.name} <span className="font-normal text-muted">to {recipient || "no recipient recorded"}</span>
                    </p>
                    <p className="text-sm text-muted">{d.event.name} · {formatDateTime(d.distributedAt)} · by {d.createdBy.name}</p>
                    <SerialChips serials={d.serials.map((s) => s.serialNumber)} />
                    {d.remarks && <p className="text-sm text-muted">Remarks: {d.remarks}</p>}
                  </div>
                }
              />
            );
          })}
        </section>
      )}
    </PageShell>
  );
}
