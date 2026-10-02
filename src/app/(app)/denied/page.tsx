import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { buttonClass, cardClass, eyebrowClass } from "../../ui";

type Params = Record<string, string | string[] | undefined>;

const ACTIONS: Record<string, string> = {
  "records:edit": "edit records",
  "records:delete": "delete records",
  "records:export": "download data",
  "catalogue:manage": "manage events and items",
  "audit:view": "view the audit log",
  "accounts:manage": "manage accounts",
};

export default async function DeniedPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const asked = Array.isArray(sp.for) ? sp.for[0] : sp.for;
  const action = (asked && ACTIONS[asked]) || "do that";

  return (
    <div className="mx-auto flex max-w-xl items-center py-12">
      <div className={`${cardClass} w-full p-8 text-center`}>
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-danger/15 text-danger">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
        <p className={eyebrowClass}>Access restricted</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">You are not allowed to {action}</h1>
        <p className="mt-3 text-sm text-muted">
          The {ROLE_LABELS[user.role]} account does not have permission for this. The attempt has been recorded in the audit log.
          If you think this is a mistake, ask the Chair or Vice Chair.
        </p>
        <Link href="/" className={`${buttonClass} mt-6`}>Back to dashboard</Link>
      </div>
    </div>
  );
}
