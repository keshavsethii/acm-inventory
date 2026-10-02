import Link from "next/link";
import Logo from "./logo";

function External() {
  return (
    <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 inline">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

const QUICK = [
  ["/", "Dashboard"],
  ["/receive", "Receive goods"],
  ["/distribute", "Distribute goods"],
  ["/stock", "Stock"],
  ["/search", "Search"],
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-nav">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div className="space-y-4">
          <Logo subtitle="Student Chapter" />
          <p className="max-w-xs text-sm text-muted">Keeping track of every sticker, kit and prize that comes through chapter events.</p>
        </div>
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted">Quick links</p>
          <ul className="space-y-3 text-sm">
            {QUICK.map(([href, label]) => (
              <li key={href}><Link href={href} className="text-muted transition hover:text-foreground">{label}</Link></li>
            ))}
            <li><a href="https://acmiiitu.in" target="_blank" rel="noreferrer" className="text-muted transition hover:text-foreground">Chapter website<External /></a></li>
          </ul>
        </div>
        <div className="space-y-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">Institute</p>
          <p className="text-muted">Indian Institute of Information Technology<br />Una, Himachal Pradesh, 177209</p>
          <a href="https://iiitu.ac.in" target="_blank" rel="noreferrer" className="text-primary hover:underline">iiitu.ac.in<External /></a>
        </div>
      </div>
      <div className="mx-auto max-w-6xl border-t border-line px-4 py-5 text-sm text-muted">
        © {new Date().getFullYear()} IIITU ACM Student Chapter. All rights reserved.
      </div>
    </footer>
  );
}
