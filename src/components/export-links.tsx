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
        <a key={kind} href={`/api/export/${kind}`} className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">
          Download {label} (CSV)
        </a>
      ))}
    </div>
  );
}
