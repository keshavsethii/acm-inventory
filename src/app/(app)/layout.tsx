import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { logout } from "../login/actions";
import Avatar from "@/components/avatar";
import Footer from "@/components/footer";
import Logo from "@/components/logo";
import Menu from "@/components/menu";
import NavLink from "@/components/nav-link";
import ThemeToggle from "@/components/theme-toggle";

const MAIN = [
  ["/", "Dashboard"],
  ["/receive", "Receive"],
  ["/distribute", "Distribute"],
  ["/stock", "Stock"],
  ["/records", "Records"],
  ["/search", "Search"],
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const manage = [
    can(user.role, "catalogue:manage") && ["/events", "Events"],
    can(user.role, "catalogue:manage") && ["/items", "Items"],
    can(user.role, "audit:view") && ["/audit", "Audit log"],
    can(user.role, "accounts:manage") && ["/accounts", "Accounts"],
  ].filter((x): x is string[] => Boolean(x));

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-nav/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/" className="mr-auto md:mr-0"><Logo /></Link>

          <nav className="order-last flex w-full items-center gap-1 overflow-x-auto md:order-none md:ml-auto md:w-auto md:overflow-visible">
            {MAIN.map(([href, label]) => <NavLink key={href} href={href}>{label}</NavLink>)}
            {manage.length > 0 && (
              <Menu label={<>Manage <span aria-hidden className="text-xs">▾</span></>} className="hidden md:block">
                {manage.map(([href, label]) => <NavLink key={href} href={href} variant="menu">{label}</NavLink>)}
              </Menu>
            )}
          </nav>

          <div className="flex items-center gap-1 md:border-l md:border-line md:pl-4">
            <ThemeToggle />
            <Menu
              align="right"
              label={
                <>
                  <Avatar name={user.name} size="sm" />
                  <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
                  <span aria-hidden className="text-xs">▾</span>
                </>
              }
            >
              <div className="px-3 py-2">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{ROLE_LABELS[user.role]}</p>
              </div>
              <div className="my-1 border-t border-line" />
              <NavLink href="/settings" variant="menu">Settings</NavLink>
              {manage.length > 0 && (
                <div className="md:hidden">
                  {manage.map(([href, label]) => <NavLink key={href} href={href} variant="menu">{label}</NavLink>)}
                </div>
              )}
              <div className="my-1 border-t border-line" />
              <form action={logout}>
                <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger transition hover:bg-surface-2">Log out</button>
              </form>
            </Menu>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
