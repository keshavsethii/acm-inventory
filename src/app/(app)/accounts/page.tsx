import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import AccountForm from "./account-form";

const ORDER = ["CHAIR", "VICE_CHAIR", "TREASURER", "SECRETARY", "VOLUNTEER"];

export default async function AccountsPage() {
  await requirePermission("accounts:manage");
  const users = await prisma.user.findMany({ select: { id: true, name: true, username: true, role: true } });
  users.sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <p className="text-sm text-zinc-500">
          Set the name of whoever holds each role, and reset a password when the team changes or someone forgets theirs.
        </p>
      </div>
      <div className="space-y-4">
        {users.map((u) => (
          <AccountForm key={u.id} userId={u.id} name={u.name} username={u.username} roleLabel={ROLE_LABELS[u.role]} />
        ))}
      </div>
    </div>
  );
}
