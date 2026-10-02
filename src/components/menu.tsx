"use client";

import { useEffect, useRef } from "react";

// A dropdown that closes when you click elsewhere, press Escape, or pick something inside it.
export default function Menu(props: {
  label: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  summaryClassName?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOutside = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current) ref.current.open = false;
    };
    document.addEventListener("click", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <details ref={ref} className={`relative ${props.className ?? ""}`}>
      <summary
        aria-label={props.ariaLabel}
        className={props.summaryClassName ?? "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-foreground"}
      >
        {props.label}
      </summary>
      <div
        onClick={() => {
          if (ref.current) ref.current.open = false;
        }}
        className={`absolute top-full z-50 mt-2 min-w-56 rounded-2xl border border-line bg-surface p-2 shadow-2xl shadow-black/30 ${props.align === "right" ? "right-0" : "left-0"}`}
      >
        {props.children}
      </div>
    </details>
  );
}
