import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { logout } from "../login/actions";
import Avatar from "@/components/avatar";
import Icon, { type IconName } from "@/components/icon";
import Logo from "@/components/logo";
import MobileNav from "@/components/mobile-nav";
import NavLink from "@/components/nav-link";
import ThemeToggle from "@/components/theme-toggle";

type NavItem = { href: string; label: string; icon: IconName; match?: string[] };

const OVERVIEW: NavItem = { href: "/", label: "Overview", icon: "home" };
const WORK: NavItem[] = [
  { href: "/receive", label: "Receive", icon: "receive" },
  { href: "/distribute", label: "Distribute", icon: "distribute" },
];
const LOOKUP: NavItem[] = [
  { href: "/search", label: "Search", icon: "search" },
  { href: "/stock", label: "Stock", icon: "stock" },
  { href: "/records", label: "Records", icon: "records" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const admin: NavItem[] = [];
  if (can(user.role, "catalogue:manage")) admin.push({ href: "/events", label: "Setup", icon: "setup", match: ["/items", "/types"] });
  if (can(user.role, "audit:view")) admin.push({ href: "/audit", label: "Audit log", icon: "audit" });
  if (can(user.role, "accounts:manage")) admin.push({ href: "/accounts", label: "Accounts", icon: "accounts" });

  const sections = [
    { title: "Work", items: WORK },
    { title: "Look up", items: LOOKUP },
    ...(admin.length ? [{ title: "Admin", items: admin }] : []),
  ];

  const settings: NavItem = { href: "/settings", label: "Settings", icon: "user" };
  const mobilePrimary = [OVERVIEW, ...WORK, LOOKUP[0]];
  const mobileMore = [LOOKUP[1], LOOKUP[2], ...admin, settings];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-nav/60 p-4 backdrop-blur lg:flex">
        <Link href="/" aria-label="Overview" className="px-2 py-3">
          <Logo stacked />
        </Link>

        <nav className="mt-4 flex-1 space-y-6 overflow-y-auto">
          <NavLink {...OVERVIEW} />
          {sections.map((s) => (
            <div key={s.title} className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted/70">{s.title}</p>
              {s.items.map((i) => <NavLink key={i.href} {...i} />)}
            </div>
          ))}
        </nav>

        <div className="mt-4 space-y-1 border-t border-line pt-4">
          <div className="flex items-center gap-3 px-2 pb-2">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>
            </div>
            <ThemeToggle />
          </div>
          <NavLink {...settings} />
          <form action={logout}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-danger">
              <Icon name="logout" /> Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-nav/85 px-4 py-2.5 backdrop-blur lg:hidden">
          <Link href="/" aria-label="Overview"><Logo /></Link>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-8 lg:px-10 lg:pb-14 lg:pt-12">{children}</main>
      </div>

      <MobileNav primary={mobilePrimary} more={mobileMore} logoutAction={logout} />
    </div>
  );
}
