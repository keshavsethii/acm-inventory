import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatShort } from "@/lib/format";
import Icon, { type IconName } from "@/components/icon";
import PageShell from "@/components/page-shell";
import { buttonClass, emptyClass, inputClass, labelClass, smallButton } from "../../ui";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const PAGE_SIZE = 40;

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "EXPORT", "LOGIN", "LOGIN_FAILED", "LOGOUT", "PASSWORD_CHANGED", "ACCOUNT_UPDATED", "ACCOUNT_PASSWORD_RESET", "ACCESS_DENIED"];
const ENTITIES = ["Receipt", "Distribution", "Event", "Item", "RecipientType", "User", "Export", "Permission"];

const VERB: Record<string, string> = {
  CREATE: "added", UPDATE: "edited", DELETE: "deleted", EXPORT: "downloaded", LOGIN: "signed in", LOGIN_FAILED: "failed to sign in",
  LOGOUT: "signed out", PASSWORD_CHANGED: "changed their password", ACCOUNT_UPDATED: "updated an account",
  ACCOUNT_PASSWORD_RESET: "reset a password", ACCESS_DENIED: "was blocked from",
};
const OBJECT: Record<string, string> = {
  Receipt: "a receipt", Distribution: "a distribution", Event: "an event", Item: "an item", RecipientType: "a recipient type", Export: "an export",
};
const PERMISSION_TEXT: Record<string, string> = {
  "records:edit": "editing records", "records:delete": "deleting records", "records:export": "downloading data",
  "catalogue:manage": "managing events and items", "audit:view": "the audit log", "accounts:manage": "managing accounts",
};

function look(action: string): { icon: IconName; tone: string } {
  if (action === "DELETE") return { icon: "trash", tone: "bg-danger/15 text-danger" };
  if (action === "ACCESS_DENIED" || action === "LOGIN_FAILED") return { icon: "lock", tone: "bg-danger/15 text-danger" };
  if (action === "CREATE") return { icon: "plus", tone: "bg-success/15 text-success" };
  if (action === "UPDATE" || action.startsWith("ACCOUNT") || action === "PASSWORD_CHANGED") return { icon: "edit", tone: "bg-primary/15 text-primary" };
  if (action === "EXPORT") return { icon: "download", tone: "bg-primary/15 text-primary" };
  return { icon: "user", tone: "bg-surface-2 text-muted" };
}

function sentence(action: string, entityType: string, entityId: string) {
  const verb = VERB[action] ?? action.toLowerCase();
  if (action === "ACCESS_DENIED") return `${verb} ${PERMISSION_TEXT[entityId] ?? "something"}`;
  if (["CREATE", "UPDATE", "DELETE", "EXPORT"].includes(action)) return `${verb} ${OBJECT[entityType] ?? entityType.toLowerCase()}`;
  return verb;
}

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
    return changes.length ? changes.join(" · ") : "No visible change";
  }
  if ("tried" in d) return "";
  return Object.entries(d)
    .filter(([, v]) => v != null && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${label(k)}: ${show(v, names)}`)
    .join(" · ");
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requirePermission("audit:view");
  const sp = await searchParams;
  const userId = one(sp.user);
  const action = ACTIONS.includes(one(sp.action)) ? one(sp.action) : "";
  const entity = ENTITIES.includes(one(sp.entity)) ? one(sp.entity) : "";
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);
  const filterCount = [userId, action, entity].filter(Boolean).length;

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
    <PageShell title="Audit log" description="Who did what, and when. Entries cannot be changed or removed from the app.">
      <form method="get" className="space-y-3">
        <details open={filterCount > 0}>
          <summary className={`${smallButton()} cursor-pointer gap-2`}>
            <Icon name="filter" size={14} />
            Filters
            {filterCount > 0 && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{filterCount}</span>}
          </summary>
          <div className="mt-3 grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-4 sm:items-end">
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
                {ACTIONS.map((a) => <option key={a} value={a}>{VERB[a] ?? a}</option>)}
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
              <button type="submit" className={buttonClass}>Apply</button>
              <a href="/audit" className="text-sm text-muted underline hover:text-foreground">Clear</a>
            </div>
          </div>
        </details>
      </form>

      {entries.length === 0 ? (
        <p className={emptyClass}>No entries.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {entries.map((e) => {
            const l = look(e.action);
            const extra = describe(e.details, names);
            return (
              <li key={e.id} className="flex items-start gap-4 px-4 py-3.5">
                <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${l.tone}`}><Icon name={l.icon} size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{e.user.name}</span>{" "}
                    <span className="text-xs text-muted">({ROLE_LABELS[e.user.role]})</span>{" "}
                    {sentence(e.action, e.entityType, e.entityId)}
                  </p>
                  {extra && <p className="mt-0.5 break-words text-sm text-muted">{extra}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted">{formatShort(e.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{total} entries · page {page} of {pages}</span>
        <div className="flex gap-4">
          {page > 1 && <Link href={link(page - 1)} className="text-primary hover:underline">Newer</Link>}
          {page < pages && <Link href={link(page + 1)} className="text-primary hover:underline">Older</Link>}
        </div>
      </div>
    </PageShell>
  );
}
