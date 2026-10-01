"use client";

import { useActionState } from "react";
import { updateAccount, type AccountState } from "./actions";
import { buttonClass, inputClass, labelClass } from "../../ui";

export default function AccountForm(props: { userId: string; name: string; username: string; roleLabel: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateAccount, {});

  return (
    <form action={action} className="rounded-lg border border-zinc-200 bg-white p-4">
      <input type="hidden" name="userId" value={props.userId} />
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-medium">{props.roleLabel}</h2>
        <span className="text-sm text-zinc-500">username: {props.username}</span>
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
      {state.error && <p className="mt-2 text-sm text-red-600" role="alert">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-green-700">{state.success}</p>}
    </form>
  );
}
