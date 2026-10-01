import { requireUser } from "@/lib/auth";
import PasswordForm from "./password-form";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-zinc-500">Username: {user.username}</p>
      </div>
      <PasswordForm />
    </div>
  );
}
