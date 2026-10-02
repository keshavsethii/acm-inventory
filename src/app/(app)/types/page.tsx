import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import ActionForm from "@/components/action-form";
import AddPanel from "@/components/add-panel";
import PageShell from "@/components/page-shell";
import { SetupTabs } from "@/components/tabs";
import { inputClass, labelClass, smallButton } from "../../ui";
import { addRecipientType, toggleRecipientType } from "../items/actions";

export default async function TypesPage() {
  await requirePermission("catalogue:manage");
  const types = await prisma.recipientType.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <PageShell title="Setup" description="Events, items and recipient types used across the app.">
      <SetupTabs current="types" />

      <AddPanel label="New type">
        <ActionForm action={addRecipientType} submitLabel="Add type">
          <div className="max-w-sm">
            <label className={labelClass}>Type name (for example Guest or Judge)</label>
            <input name="name" required maxLength={40} className={inputClass} />
          </div>
        </ActionForm>
      </AddPanel>

      <section className="space-y-2.5">
        <p className="text-sm text-muted">These are the choices on the Distribute form. Hiding one keeps old records intact.</p>
        {types.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-3.5">
            <span className={t.isActive ? "font-semibold" : "text-muted line-through"}>{t.name}</span>
            <form action={toggleRecipientType.bind(null, t.id)}>
              <button className={smallButton()}>{t.isActive ? "Hide" : "Show"}</button>
            </form>
          </div>
        ))}
      </section>
    </PageShell>
  );
}
