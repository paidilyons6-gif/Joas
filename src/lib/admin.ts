const DEFAULT_ADMINS = [
  "r.lyons1@icloud.com",
];

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const fromEnv = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)
    ?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const list = fromEnv?.length ? fromEnv : DEFAULT_ADMINS;
  return list.includes(normalized);
}
