const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
const dateOnly = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" });

export const formatDateTime = (d: Date) => dateTime.format(d);
// Event dates are stored as UTC midnight, so they are shown in UTC.
export const formatDate = (d: Date) => dateOnly.format(d);
export const toDateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

// Indian academic year runs July to June, e.g. "2026-27".
export function currentAcademicYear(now = new Date()) {
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}
