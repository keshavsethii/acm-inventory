"use client";

import { useState } from "react";
import { smallButton } from "@/app/ui";

export type RowAction = { key: string; label: string; tone?: "default" | "danger"; panel: React.ReactNode };

// A card with a summary on the left and action buttons on the right.
// Nothing is editable until a button is pressed; then its panel opens underneath.
export default function ExpandableRow(props: { summary: React.ReactNode; actions: RowAction[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const current = props.actions.find((a) => a.key === openKey);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">{props.summary}</div>
        {props.actions.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {props.actions.map((a) => (
              <button
                key={a.key}
                type="button"
                aria-expanded={openKey === a.key}
                onClick={() => setOpenKey(openKey === a.key ? null : a.key)}
                className={smallButton(a.tone, openKey === a.key)}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {current && (
        <div key={current.key} className="mt-4 border-t border-line pt-4">
          {current.panel}
        </div>
      )}
    </div>
  );
}
