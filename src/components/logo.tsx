import Image from "next/image";

// To use the chapter's real logo, replace public/logo.svg (keep the file name),
// or change this path (for example to "/logo.png").
const LOGO_SRC = "/logo.svg";

export default function Logo({ subtitle = "Inventory", stacked = false }: { subtitle?: string; stacked?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Image src={LOGO_SRC} alt="" width={36} height={36} unoptimized className="size-9 rounded-lg" priority />
      {stacked ? (
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight">IIITU ACM</span>
          <span className="text-xs text-muted">{subtitle}</span>
        </span>
      ) : (
        <span className="flex items-baseline gap-2">
          <span className="text-base font-bold tracking-tight">IIITU ACM</span>
          <span className="hidden text-sm text-muted sm:inline">{subtitle}</span>
        </span>
      )}
    </span>
  );
}
