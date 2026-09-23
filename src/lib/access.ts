export function isMember(plan: string | undefined | null) {
  return plan === "monthly" || plan === "annual";
}

/** All learning content requires an active membership (admins bypass). */
export function canAccessContent(
  plan: string | undefined | null,
  opts?: { isAdmin?: boolean },
) {
  if (opts?.isAdmin) return true;
  return isMember(plan);
}

export function canAccessLesson(
  membersOnly: boolean,
  plan: string | undefined | null,
  opts?: { isAdmin?: boolean },
) {
  void membersOnly;
  return canAccessContent(plan, opts);
}
