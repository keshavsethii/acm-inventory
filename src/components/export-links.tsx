import Icon from "./icon";
import Menu from "./menu";
import { smallButton } from "@/app/ui";

const EXPORTS = [
  ["receipts", "Goods received"],
  ["distributions", "Goods distributed"],
  ["serials", "Serial register"],
  ["stock", "Stock"],
];

// One tidy "Export" button instead of four. Plain links: the browser downloads the CSV directly.
export default function ExportLinks() {
  return (
    <Menu
      align="right"
      ariaLabel="Export data"
      summaryClassName={`${smallButton()} cursor-pointer gap-2`}
      label={<><Icon name="download" size={15} /> Export CSV</>}
    >
      {EXPORTS.map(([kind, label]) => (
        <a key={kind} href={`/api/export/${kind}`} className="block rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-foreground">
          {label}
        </a>
      ))}
    </Menu>
  );
}
