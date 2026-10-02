import Image from "next/image";

// To use the chapter's real logo, replace public/logo.svg (keep the file name),
// or change this path (for example to "/logo.png").
const LOGO_SRC = "/logo.svg";

export default function Logo({ subtitle = "Inventory" }: { subtitle?: string }) {
  return (
    <span className="flex items-center gap-3">
      <Image src={LOGO_SRC} alt="" width={36} height={36} unoptimized className="size-9 rounded-lg" priority />
      <span className="flex items-baseline gap-2">
        <span className="text-base font-bold tracking-tight">IIITU ACM</span>
        <span className="hidden text-sm text-muted sm:inline">{subtitle}</span>
      </span>
    </span>
  );
}
