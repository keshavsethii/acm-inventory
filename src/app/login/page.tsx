import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/theme-toggle";
import { cardClass, eyebrowClass } from "../ui";
import LoginForm from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div aria-hidden className="glow pointer-events-none absolute inset-x-0 top-0 h-[460px]" />
      <div className="relative flex items-center justify-between px-6 py-5">
        <Logo subtitle="Student Chapter" />
        <ThemeToggle />
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className={eyebrowClass}>Member portal</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Inventory Manager</h1>
            <p className="mt-3 text-muted">Sign in with your chapter account.</p>
          </div>
          <div className={`${cardClass} p-7 shadow-2xl shadow-black/20`}>
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-xs text-muted">Core team accounts only. Ask the Chair if you need access.</p>
        </div>
      </div>
    </main>
  );
}
