"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "@/lib/form";
import { buttonClass, dangerButtonClass } from "@/app/ui";

// A form wired to a server action. Shows errors and success messages.
// If the action returns a `nonce`, the form clears itself; otherwise typed values stay
// (so an error never wipes what the user typed).
export default function ActionForm(props: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
  tone?: "primary" | "danger";
}) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(props.action, {});

  return (
    <form
      key={state.nonce ?? 0}
      className={props.className ?? "space-y-4"}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
    >
      {props.children}
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
      <button type="submit" disabled={pending} className={props.tone === "danger" ? dangerButtonClass : buttonClass}>
        {pending ? "Saving..." : props.submitLabel}
      </button>
    </form>
  );
}
