"use client";

import { useState } from "react";
import Icon from "./icon";
import { buttonClass, cardClass } from "@/app/ui";

// A "+ New ..." button that reveals a form card. Keeps pages calm until you need the form.
export default function AddPanel({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className={buttonClass}>
        <Icon name={open ? "x" : "plus"} size={16} className="mr-2" />
        {open ? "Close" : label}
      </button>
      {open && <div className={`${cardClass} mt-4`}>{children}</div>}
    </div>
  );
}
