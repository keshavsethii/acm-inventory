"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { buttonClass, inputClass, labelClass } from "../ui";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="username" className={labelClass}>Username</label>
        <input id="username" name="username" autoComplete="username" required autoFocus className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
