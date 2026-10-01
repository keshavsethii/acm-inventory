import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { currentAcademicYear, toDateInput } from "@/lib/format";
import ActionForm from "@/components/action-form";
import { cardClass, inputClass, labelClass } from "../../ui";
import { saveEvent } from "./actions";

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Events</h1>
      <section className={cardClass}>
        <h2 className="mb-3 font-medium">Add an event</h2>
        <ActionForm action={saveEvent} submitLabel="Add event">
          <EventFields year={currentAcademicYear()} />
        </ActionForm>
      </section>
      <section className="space-y-3">
        <h2 className="font-medium">All events ({events.length})</h2>
        {events.length === 0 && <p className="text-sm text-zinc-500">No events yet.</p>}
        {events.map((e) => (
          <div key={e.id} className={cardClass}>
            <ActionForm action={saveEvent} submitLabel="Save">
              <EventFields id={e.id} name={e.name} date={toDateInput(e.eventDate)} year={e.academicYear} />
            </ActionForm>
          </div>
        ))}
      </section>
    </div>
  );
}
