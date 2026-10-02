"use client";

import { useState } from "react";
import Icon from "./icon";
import NavLink from "./nav-link";
import type { IconName } from "./icon";

type Link = { href: string; label: string; icon: IconName; match?: string[] };

// Bottom tab bar for phones: four main tabs and a "More" sheet with everything else.
export default function MobileNav(props: { primary: Link[]; more: Link[]; logoutAction: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      {open && <div className="fixed inset-0 z-40 bg-black/50" onClick={close} />}
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 rounded-2xl border border-line bg-surface p-2 shadow-2xl shadow-black/40">
          {props.more.map((l) => <NavLink key={l.href} {...l} variant="sheet" onNavigate={close} />)}
          <div className="my-1 border-t border-line" />
          <form action={props.logoutAction}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-danger transition hover:bg-surface-2">
              <Icon name="logout" /> Log out
            </button>
          </form>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-nav/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-1">
          {props.primary.map((l) => <NavLink key={l.href} {...l} variant="tab" onNavigate={close} />)}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium ${open ? "text-primary" : "text-muted"}`}
          >
            <Icon name="more" size={22} />
            More
          </button>
        </div>
      </nav>
    </div>
  );
}
