// Shared by all server actions and forms.
export type FormState = {
  error?: string;
  success?: string;
  // Set by "create" actions. A new value makes the form clear itself.
  nonce?: number;
};

export function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
