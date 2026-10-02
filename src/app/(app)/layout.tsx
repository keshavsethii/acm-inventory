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
  ["/receive", "Receive"],
  ["/distribute", "Distribute"],
  ["/stock", "Stock"],
  ["/records", "Records"],
  ["/search", "Search"],
];

function Chevron() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
          <Link href="/" aria-label="Go to dashboard" className="mr-auto md:mr-0">
            <Logo />
          </Link>

          <nav className="order-last flex w-full items-center gap-1 overflow-x-auto pb-1 md:order-none md:ml-auto md:w-auto md:overflow-visible md:pb-0">
            {MAIN.map(([href, label]) => <NavLink key={href} href={href}>{label}</NavLink>)}
            {manage.length > 0 && (
              <Menu label={<>Manage <Chevron /></>} className="hidden md:block">
                {manage.map(([href, label]) => <NavLink key={href} href={href} variant="menu">{label}</NavLink>)}
              </Menu>
            )}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Menu
              align="right"
              ariaLabel="Account menu"
              summaryClassName="flex cursor-pointer items-center rounded-xl p-0.5 transition hover:ring-2 hover:ring-primary/40"
              label={<Avatar name={user.name} size="md" />}
            >
              <div className="px-3 py-2">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{ROLE_LABELS[user.role]}</p>
              </div>
              <div className="my-1 border-t border-line" />
              <NavLink href="/" variant="menu">Dashboard</NavLink>
              <NavLink href="/settings" variant="menu">Settings</NavLink>
              {manage.length > 0 && (
                <div className="md:hidden">
                  <div className="my-1 border-t border-line" />
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
