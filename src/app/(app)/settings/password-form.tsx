"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "./actions";
import { buttonClass, inputClass, labelClass } from "../../ui";

export default function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {});

  return (
    <form action={action} className="max-w-sm space-y-4">
      <div>
        <label htmlFor="current" className={labelClass}>Current password</label>
        <input id="current" name="current" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="next" className={labelClass}>New password (10 to 72 characters)</label>
        <input id="next" name="next" type="password" autoComplete="new-password" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
      </div>
      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">Password updated.</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
