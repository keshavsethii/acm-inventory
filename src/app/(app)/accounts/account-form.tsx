"use client";

import { useActionState } from "react";
import { updateAccount, type AccountState } from "./actions";
import Avatar from "@/components/avatar";
import { buttonClass, cardClass, eyebrowClass, inputClass, labelClass } from "../../ui";

export default function AccountForm(props: { userId: string; name: string; username: string; roleLabel: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateAccount, {});

  return (
    <form action={action} className={cardClass}>
      <input type="hidden" name="userId" value={props.userId} />
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <Avatar name={props.name} size="lg" />
        <div>
          <p className="text-lg font-semibold">{props.name}</p>
          <p className={eyebrowClass}>{props.roleLabel}</p>
        </div>
        <span className="text-sm text-muted sm:ml-auto">username: <span className="font-mono text-foreground">{props.username}</span></span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className={labelClass}>Name</label>
          <input name="name" defaultValue={props.name} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>New password (leave empty to keep)</label>
          <input name="newPassword" type="password" autoComplete="new-password" className={inputClass} />
        </div>
        <button type="submit" disabled={pending} className={buttonClass}>{pending ? "Saving..." : "Save"}</button>
      </div>
      {state.error && <p className="mt-2 text-sm text-danger" role="alert">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-success">{state.success}</p>}
    </form>
  );
}
