// Turns pasted text (one serial per line) into a clean list.
export function parseSerialLines(text: string) {
  const all = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const s of all) (seen.has(s) ? duplicates : seen).add(s);
  return { serials: [...seen], duplicates: [...duplicates] };
}
