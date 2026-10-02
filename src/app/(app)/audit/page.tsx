import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { buttonClass, cardClass, inputClass, labelClass, tableClass, tdClass, thClass } from "../../ui";
import PageShell from "@/components/page-shell";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const PAGE_SIZE = 50;

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "EXPORT", "LOGIN", "LOGIN_FAILED", "LOGOUT", "PASSWORD_CHANGED", "ACCOUNT_UPDATED", "ACCOUNT_PASSWORD_RESET", "ACCESS_DENIED"];
const ENTITIES = ["Receipt", "Distribution", "Event", "Item", "RecipientType", "User", "Export", "Permission"];

// Event and recipient-type ids inside the details are shown as names.
function collectIds(value: unknown, out: Set<string>) {
  if (!value || typeof value !== "object") return;
  for (const [key, v] of Object.entries(value)) {
    if ((key === "eventId" || key === "recipientTypeId") && typeof v === "string") out.add(v);
    else collectIds(v, out);
  }
}

const label = (key: string) => key.replace(/Id$/, "").replace(/([A-Z])/g, " $1").toLowerCase();

function show(value: unknown, names: Map<string, string>): string {
  if (value == null || value === "") return "none";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "none";
  if (typeof value === "string") return names.get(value) ?? value;
  return String(value);
}

function describe(details: unknown, names: Map<string, string>): string {
  if (!details || typeof details !== "object") return "";
  const d = details as Record<string, unknown>;
  if (d.before && d.after && typeof d.before === "object" && typeof d.after === "object") {
    const before = d.before as Record<string, unknown>;
    const after = d.after as Record<string, unknown>;
    const changes = Object.keys(after)
      .filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]))
      .map((k) => `${label(k)}: ${show(before[k], names)} → ${show(after[k], names)}`);
    return changes.length ? changes.join("; ") : "No visible change";
  }
  return Object.entries(d)
    .filter(([, v]) => v != null && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${label(k)}: ${show(v, names)}`)
    .join("; ");
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requirePermission("audit:view");
  const sp = await searchParams;
  const userId = one(sp.user);
  const action = ACTIONS.includes(one(sp.action)) ? one(sp.action) : "";
  const entity = ENTITIES.includes(one(sp.entity)) ? one(sp.entity) : "";
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);

  const where: Prisma.AuditLogWhereInput = {
    ...(userId ? { userId } : {}),
    ...(action ? { action } : {}),
    ...(entity ? { entityType: entity } : {}),
  };

  const [users, total, entries] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, role: true } }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, role: true } } },
    }),
  ]);

  const ids = new Set<string>();
  entries.forEach((e) => collectIds(e.details, ids));
  const [events, types] = await Promise.all([
    prisma.event.findMany({ where: { id: { in: [...ids] } }, select: { id: true, name: true } }),
    prisma.recipientType.findMany({ where: { id: { in: [...ids] } }, select: { id: true, name: true } }),
  ]);
  const names = new Map([...events, ...types].map((x) => [x.id, x.name]));

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: number) => {
    const qs = new URLSearchParams({ ...(userId && { user: userId }), ...(action && { action }), ...(entity && { entity }), page: String(p) });
    return `/audit?${qs.toString()}`;
  };

  return (
    <PageShell eyebrow="Transparency" title="Audit log" description="Every login, entry, edit, delete and export. Entries cannot be changed or removed from the app.">

      <form method="get" className={`${cardClass} grid gap-3 sm:grid-cols-4 sm:items-end`}>
        <div>
          <label className={labelClass}>Who</label>
          <select name="user" defaultValue={userId} className={inputClass}>
            <option value="">Anyone</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role]})</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Action</label>
          <select name="action" defaultValue={action} className={inputClass}>
            <option value="">Any</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>About</label>
          <select name="entity" defaultValue={entity} className={inputClass}>
            <option value="">Anything</option>
            {ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className={buttonClass}>Filter</button>
          <a href="/audit" className="text-sm underline">Clear</a>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className={tableClass}>
          <thead>
            <tr><th className={thClass}>When</th><th className={thClass}>Who</th><th className={thClass}>Action</th><th className={thClass}>About</th><th className={thClass}>Details</th></tr>
          </thead>
          <tbody>
            {entries.length === 0 && <tr><td className={tdClass} colSpan={5}>No entries.</td></tr>}
            {entries.map((e) => (
              <tr key={e.id}>
                <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(e.createdAt)}</td>
                <td className={tdClass}>{e.user.name} <span className="text-xs text-muted">({ROLE_LABELS[e.user.role]})</span></td>
                <td className={tdClass}>{e.action}</td>
                <td className={tdClass}>{e.entityType}</td>
                <td className={`${tdClass} break-words`}>{describe(e.details, names)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{total} entries, page {page} of {pages}</span>
        <div className="flex gap-4">
          {page > 1 && <Link href={link(page - 1)} className="underline">Newer</Link>}
          {page < pages && <Link href={link(page + 1)} className="underline">Older</Link>}
        </div>
      </div>
    </PageShell>
  );
}
