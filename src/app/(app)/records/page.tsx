import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatDateTime, formatShort } from "@/lib/format";
import ActionForm from "@/components/action-form";
import type { RowAction } from "@/components/expandable-row";
import ExportLinks from "@/components/export-links";
import Facts from "@/components/facts";
import PageShell from "@/components/page-shell";
import RecordRow from "@/components/record-row";
import SerialChips from "@/components/serial-chips";
import Tabs from "@/components/tabs";
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

  return (
    <PageShell
      title="Records"
      description="Everything that came in and went out. Deleted records stay in the audit log."
      actions={can(user.role, "records:export") ? <ExportLinks /> : null}
    >
      <Tabs
        tabs={[
          { href: "/records", label: `Received (${receiptCount})`, active: view === "received" },
          { href: "/records?view=distributed", label: `Given out (${distributionCount})`, active: view === "distributed" },
        ]}
      />

      {view === "received" && (
        <section className="space-y-2.5">
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
              <RecordRow
                key={r.id}
                kind="in"
                title={`${r.quantity} × ${r.item.name}`}
                subtitle={`from ${r.receivedFrom} · ${r.event.name}`}
                side={formatShort(r.receivedAt)}
                actions={actions}
                details={
                  <div className="space-y-4">
                    <Facts rows={[["Event", r.event.name], ["Received", formatDateTime(r.receivedAt)], ["Entered by", r.createdBy.name], ["Remarks", r.remarks ?? "-"]]} />
                    <SerialChips serials={r.serials.map((s) => s.serialNumber)} limit={12} />
                  </div>
                }
              />
            );
          })}
        </section>
      )}

      {view === "distributed" && (
        <section className="space-y-2.5">
          {distributions.length === 0 && <p className={emptyClass}>Nothing given out yet.</p>}
          {distributions.map((d) => {
            const typeOptions = types.filter((t) => t.isActive || t.id === d.recipientTypeId).map((t) => ({ id: t.id, label: t.name }));
            const recipient = [d.recipientName, d.rollNumber].filter(Boolean).join(" · ");
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
              <RecordRow
                key={d.id}
                kind="out"
                title={`${d.quantity} × ${d.item.name}`}
                subtitle={`${recipient ? `to ${recipient}` : "no recipient recorded"} · ${d.event.name}`}
                side={formatShort(d.distributedAt)}
                actions={actions}
                details={
                  <div className="space-y-4">
                    <Facts rows={[["Event", d.event.name], ["Given", formatDateTime(d.distributedAt)], ["Recipient type", d.recipientType?.name ?? "-"], ["Entered by", d.createdBy.name], ["Remarks", d.remarks ?? "-"]]} />
                    <SerialChips serials={d.serials.map((s) => s.serialNumber)} limit={12} />
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
