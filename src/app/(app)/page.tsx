import { requireUser } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/permissions";

export default async function Dashboard() {
  const user = await requireUser();
  const abilities = [
    ["Add goods received and distribute items", can(user.role, "records:create")],
    ["Edit or delete past records", can(user.role, "records:edit")],
    ["Create events and items", can(user.role, "catalogue:manage")],
    ["View the audit log", can(user.role, "audit:view")],
    ["Manage accounts", can(user.role, "accounts:manage")],
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-sm text-zinc-500">Signed in as {ROLE_LABELS[user.role]}</p>
      </div>
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-medium">What you can do</h2>
        <ul className="space-y-1 text-sm">
          {abilities.map(([label, allowed]) => (
            <li key={label} className={allowed ? "text-zinc-900" : "text-zinc-400 line-through"}>
              {allowed ? "Yes" : "No"}: {label}
            </li>
          ))}
        </ul>
      </section>
      <p className="text-sm text-zinc-500">Events, goods and distribution screens arrive in the next phase.</p>
    </div>
  );
}
