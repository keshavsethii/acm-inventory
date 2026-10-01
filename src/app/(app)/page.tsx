import Link from "next/link";
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
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/receive" className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700">Receive goods</Link>
        <Link href="/distribute" className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700">Distribute goods</Link>
        <Link href="/stock" className="rounded-md border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100">View stock</Link>
      </div>
    </div>
  );
}
