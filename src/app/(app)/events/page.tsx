import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { currentAcademicYear, formatDate, toDateInput } from "@/lib/format";
import ActionForm from "@/components/action-form";
import ExpandableRow from "@/components/expandable-row";
import PageShell from "@/components/page-shell";
import { cardClass, emptyClass, inputClass, labelClass, sectionTitleClass } from "../../ui";
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
    <PageShell eyebrow="Catalogue" title="Events" description="The events that goods are received for and given out at.">
      <section className={cardClass}>
        <h2 className={`${sectionTitleClass} mb-4`}>Add an event</h2>
        <ActionForm action={saveEvent} submitLabel="Add event">
          <EventFields year={currentAcademicYear()} />
        </ActionForm>
      </section>

      <section className="space-y-3">
        <h2 className={sectionTitleClass}>All events <span className="font-normal text-muted">({events.length})</span></h2>
        {events.length === 0 && <p className={emptyClass}>No events yet. Add the first one above.</p>}
        {events.map((e) => (
          <ExpandableRow
            key={e.id}
            summary={
              <>
                <p className="font-semibold">{e.name}</p>
                <p className="mt-0.5 text-sm text-muted">{e.eventDate ? `${formatDate(e.eventDate)} · ` : ""}Academic year {e.academicYear}</p>
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
                    <p className="text-sm text-muted">Removing is only possible when the event has no records. This cannot be undone from the app.</p>
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
