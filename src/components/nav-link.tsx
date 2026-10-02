"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./icon";

type Props = {
  href: string;
  label: string;
  icon: IconName;
  match?: string[]; // other paths that count as "inside" this link
  variant?: "side" | "tab" | "sheet";
  onNavigate?: () => void;
};

export default function NavLink({ href, label, icon, match = [], variant = "side", onNavigate }: Props) {
  const pathname = usePathname();
  const active = [href, ...match].some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));

  const style =
    variant === "tab"
      ? `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium ${active ? "text-primary" : "text-muted"}`
      : `flex items-center gap-3 rounded-xl px-3 ${variant === "sheet" ? "py-3" : "py-2.5"} text-sm font-medium transition ${
          active ? "bg-primary/12 text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground"
        }`;

  return (
    <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={style}>
      <Icon name={icon} size={variant === "tab" ? 22 : 18} />
      {label}
    </Link>
  );
}
