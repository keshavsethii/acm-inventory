export type Cell = string | number | null | undefined;

// Builds a CSV that opens correctly in Excel (UTF-8 BOM, CRLF line ends).
// Text starting with = + - @ would be run as a formula by Excel, so it gets a leading apostrophe.
export function toCsv(rows: Cell[][]) {
  const escape = (cell: Cell) => {
    let text = cell == null ? "" : String(cell);
    if (typeof cell === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return "\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n") + "\r\n";
}

// "2026-10-02 14:30" in Indian Standard Time.
export function istStamp(date: Date) {
  return new Date(date.getTime() + 5.5 * 3600_000).toISOString().slice(0, 16).replace("T", " ");
}
