"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink(props: { href: string; children: React.ReactNode; variant?: "pill" | "menu" }) {
  const pathname = usePathname();
  const active = props.href === "/" ? pathname === "/" : pathname === props.href || pathname.startsWith(`${props.href}/`);
  const base = props.variant === "menu" ? "block rounded-lg px-3 py-2 text-sm font-medium" : "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium";
  const tone = active ? "bg-primary/15 text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground";
  return (
    <Link href={props.href} aria-current={active ? "page" : undefined} className={`${base} transition ${tone}`}>
      {props.children}
    </Link>
  );
}
