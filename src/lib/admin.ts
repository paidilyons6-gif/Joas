const DEFAULT_ADMINS = [
  "becca.member.test@gmail.com",
  "paidilyons6@gmail.com",
  "becky@bodiesbybecca.com",
  "becca@bodiesbybecca.com",
  "rebecca@bodiesbybecca.com",
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
