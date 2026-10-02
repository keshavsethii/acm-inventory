// Shared Tailwind class strings. Colours come from the theme tokens in globals.css.
export const inputClass =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60";
export const buttonClass =
  "inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50";
export const labelClass = "mb-1.5 block text-sm font-medium text-muted";
export const cardClass = "rounded-2xl border border-line bg-surface p-5 sm:p-6";
export const eyebrowClass = "text-xs font-semibold uppercase tracking-[0.15em] text-primary";
export const tableClass = "w-full text-left text-sm";
export const thClass = "border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted";
export const tdClass = "border-b border-line/60 px-4 py-3";
const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
export const pillBlue = `${pill} bg-primary/15 text-primary`;
export const pillGreen = `${pill} bg-success/15 text-success`;
export const pillGray = `${pill} bg-surface-2 text-muted`;
