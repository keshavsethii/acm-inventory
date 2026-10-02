import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import ActionForm from "@/components/action-form";
import Avatar from "@/components/avatar";
import ExpandableRow from "@/components/expandable-row";
import PageShell from "@/components/page-shell";
import { eyebrowClass, inputClass, labelClass } from "../../ui";
import { updateAccount } from "./actions";

const ORDER = ["CHAIR", "VICE_CHAIR", "TREASURER", "SECRETARY", "VOLUNTEER"];

export default async function AccountsPage() {
  await requirePermission("accounts:manage");
  const users = await prisma.user.findMany({ select: { id: true, name: true, username: true, role: true } });
  users.sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role));

  return (
    <PageShell
      title="Accounts"
      description="Pick an account to rename it or reset its password, for example when the team changes or someone forgets theirs."
    >
      <section className="space-y-2.5">
        {users.map((u) => (
          <ExpandableRow
            key={u.id}
            summary={
              <div className="flex items-center gap-4">
                <Avatar name={u.name} size="lg" />
                <div>
                  <p className="text-lg font-semibold leading-tight">{u.name}</p>
                  <p className={eyebrowClass}>{ROLE_LABELS[u.role]}</p>
                  <p className="mt-1 text-sm text-muted">Username <span className="font-mono text-foreground">{u.username}</span></p>
                </div>
              </div>
            }
            actions={[
              {
                key: "name",
                label: "Edit name",
                panel: (
                  <ActionForm action={updateAccount} submitLabel="Save name">
                    <input type="hidden" name="userId" value={u.id} />
                    <div className="max-w-md">
                      <label className={labelClass}>Name</label>
                      <input name="name" defaultValue={u.name} required maxLength={80} className={inputClass} />
                    </div>
                  </ActionForm>
                ),
              },
              {
                key: "password",
                label: "Reset password",
                panel: (
                  <ActionForm action={updateAccount} submitLabel="Reset password">
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="name" value={u.name} />
                    <div className="max-w-md">
                      <label className={labelClass}>New password (10 to 72 characters)</label>
                      <input name="newPassword" type="password" required minLength={10} maxLength={72} autoComplete="new-password" className={inputClass} />
                    </div>
                    <p className="text-sm text-muted">Tell them the new password privately. They can change it themselves in Settings.</p>
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
