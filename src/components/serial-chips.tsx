"use client";

import { useState } from "react";

// Serial numbers as small chips. Long lists show the first few with a "Show all" button.
export default function SerialChips({ serials, limit = 6 }: { serials: string[]; limit?: number }) {
  const [all, setAll] = useState(false);
  if (serials.length === 0) return null;
  const shown = all ? serials : serials.slice(0, limit);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((s) => (
        <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-xs">{s}</span>
      ))}
      {serials.length > limit && (
        <button type="button" onClick={() => setAll(!all)} className="text-xs font-medium text-primary hover:underline">
          {all ? "Show fewer" : `+${serials.length - limit} more`}
        </button>
      )}
    </div>
  );
}
