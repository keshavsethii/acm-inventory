import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { logout } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <Link href="/" className="font-semibold">ACM Inventory</Link>
            <Link href="/receive" className="text-zinc-600 hover:text-zinc-900">Receive</Link>
            <Link href="/distribute" className="text-zinc-600 hover:text-zinc-900">Distribute</Link>
            <Link href="/stock" className="text-zinc-600 hover:text-zinc-900">Stock</Link>
            {can(user.role, "catalogue:manage") && (
              <>
                <Link href="/events" className="text-zinc-600 hover:text-zinc-900">Events</Link>
                <Link href="/items" className="text-zinc-600 hover:text-zinc-900">Items</Link>
              </>
            )}
            {can(user.role, "accounts:manage") && (
              <Link href="/accounts" className="text-zinc-600 hover:text-zinc-900">Accounts</Link>
            )}
            <Link href="/settings" className="text-zinc-600 hover:text-zinc-900">Settings</Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-600">
              {user.name} <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{ROLE_LABELS[user.role]}</span>
            </span>
            <form action={logout}>
              <button className="text-zinc-600 underline hover:text-zinc-900">Log out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
