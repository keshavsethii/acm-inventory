const EXPORTS = [
  ["receipts", "Goods received"],
  ["distributions", "Goods distributed"],
  ["serials", "Serial register"],
  ["stock", "Stock"],
];

// Plain links: the browser downloads the file straight from the export route.
export default function ExportLinks() {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {EXPORTS.map(([kind, label]) => (
        <a
          key={kind}
          href={`/api/export/${kind}`}
          className="rounded-xl border border-line bg-surface px-3.5 py-2 font-medium transition hover:border-primary/60 hover:bg-surface-2"
        >
          ↓ {label} (CSV)
        </a>
      ))}
    </div>
  );
}
