"use client";

import { useState } from "react";
import Icon from "./icon";
import { smallButton } from "@/app/ui";
import type { RowAction } from "./expandable-row";

const KIND = {
  in: { icon: "receive", tone: "bg-success/15 text-success" },
  out: { icon: "distribute", tone: "bg-primary/15 text-primary" },
  unit: { icon: "tag", tone: "bg-surface-2 text-muted" },
} as const;

// One calm line per record. Click to reveal the details and the Edit/Delete buttons.
export default function RecordRow(props: {
  kind: keyof typeof KIND;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  side?: React.ReactNode;
  details: React.ReactNode;
  actions?: RowAction[];
}) {
  const [open, setOpen] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const actions = props.actions ?? [];
  const panel = actions.find((a) => a.key === actionKey);
  const k = KIND[props.kind];

  return (
    <div className={`rounded-2xl border bg-surface transition ${open ? "border-primary/40" : "border-line hover:border-line/80"}`}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-4 px-4 py-3.5 text-left">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${k.tone}`}>
          <Icon name={k.icon} size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{props.title}</span>
          <span className="block truncate text-sm text-muted">{props.subtitle}</span>
        </span>
        {props.side && <span className="hidden shrink-0 text-sm text-muted sm:block">{props.side}</span>}
        <Icon name="chevron" size={16} className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-line px-4 py-4">
          {props.details}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setActionKey(actionKey === a.key ? null : a.key)}
                  aria-expanded={actionKey === a.key}
                  className={smallButton(a.tone, actionKey === a.key)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
          {panel && (
            <div key={panel.key} className="border-t border-line pt-4">
              {panel.panel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
