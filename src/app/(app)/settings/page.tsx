import { requireUser } from "@/lib/auth";
import PasswordForm from "./password-form";
import PageShell from "@/components/page-shell";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <PageShell eyebrow="Account" title="Settings" description={`Signed in as ${user.username}. Change your password here.`}>
      <PasswordForm />
    </PageShell>
  );
}
