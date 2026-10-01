import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">ACM Inventory Manager</h1>
        <p className="mb-6 text-sm text-zinc-500">ACM Student Chapter, IIIT Una</p>
        <LoginForm />
      </div>
    </main>
  );
}
