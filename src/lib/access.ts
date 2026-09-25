export function hasProgram(
  entitlements: string[] | undefined | null,
  slug: string,
) {
  if (!slug) return false;
  return (entitlements || []).includes(slug);
}

/** Bought any program — unlocks shared Office tools / community. */
export function hasAnyProgram(entitlements: string[] | undefined | null) {
  return (entitlements || []).length > 0;
}

/** Portal learning content: admin, or owns at least one program. */
export function canAccessContent(
  entitlements: string[] | undefined | null,
  opts?: { isAdmin?: boolean },
) {
  if (opts?.isAdmin) return true;
  return hasAnyProgram(entitlements);
}

/** Course track access: specific program if linked, else any purchase. */
export function canAccessProgramContent(
  entitlements: string[] | undefined | null,
  programSlug: string | undefined | null,
  opts?: { isAdmin?: boolean },
) {
  if (opts?.isAdmin) return true;
  if (programSlug) return hasProgram(entitlements, programSlug);
  return hasAnyProgram(entitlements);
}

export function canAccessLesson(
  membersOnly: boolean,
  entitlements: string[] | undefined | null,
  opts?: { isAdmin?: boolean; programSlug?: string | null },
) {
  if (!membersOnly) return true;
  return canAccessProgramContent(entitlements, opts?.programSlug, opts);
}

/** @deprecated Use hasAnyProgram — kept for gradual migration */
export function isMember(plan: string | undefined | null) {
  return plan === "monthly" || plan === "annual";
}
