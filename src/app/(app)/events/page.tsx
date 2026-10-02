import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { currentAcademicYear, formatDate, toDateInput } from "@/lib/format";
import ActionForm from "@/components/action-form";
import AddPanel from "@/components/add-panel";
import ExpandableRow from "@/components/expandable-row";
import PageShell from "@/components/page-shell";
import { SetupTabs } from "@/components/tabs";
import { emptyClass, inputClass, labelClass } from "../../ui";
import { removeEvent, saveEvent } from "./actions";

function EventFields(props: { id?: string; name?: string; date?: string; year: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {props.id && <input type="hidden" name="id" value={props.id} />}
      <div>
        <label className={labelClass}>Event name</label>
        <input name="name" defaultValue={props.name} required maxLength={120} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Date (optional)</label>
        <input name="eventDate" type="date" defaultValue={props.date} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Academic year</label>
        <input name="academicYear" defaultValue={props.year} required pattern="\d{4}-\d{2}" className={inputClass} />
      </div>
    </div>
  );
}

export default async function EventsPage() {
  await requirePermission("catalogue:manage");
  const events = await prisma.event.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });

  return (
    <PageShell title="Setup" description="Events, items and recipient types used across the app.">
      <SetupTabs current="events" />

      <AddPanel label="New event">
        <ActionForm action={saveEvent} submitLabel="Add event">
          <EventFields year={currentAcademicYear()} />
        </ActionForm>
      </AddPanel>

      <section className="space-y-2.5">
        {events.length === 0 && <p className={emptyClass}>No events yet.</p>}
        {events.map((e) => (
          <ExpandableRow
            key={e.id}
            summary={
              <>
                <p className="font-semibold">{e.name}</p>
                <p className="mt-0.5 text-sm text-muted">{e.eventDate ? `${formatDate(e.eventDate)} · ` : ""}{e.academicYear}</p>
              </>
            }
            actions={[
              {
                key: "edit",
                label: "Edit",
                panel: (
                  <ActionForm action={saveEvent} submitLabel="Save changes">
                    <EventFields id={e.id} name={e.name} date={toDateInput(e.eventDate)} year={e.academicYear} />
                  </ActionForm>
                ),
              },
              {
                key: "remove",
                label: "Remove",
                tone: "danger",
                panel: (
                  <ActionForm action={removeEvent} submitLabel="Remove event" tone="danger">
                    <input type="hidden" name="id" value={e.id} />
                    <p className="text-sm text-muted">Only possible when the event has no records.</p>
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
