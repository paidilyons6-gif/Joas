export function isMember(plan: string | undefined | null) {
  return plan === "monthly" || plan === "annual";
}

export function canAccessLesson(
  membersOnly: boolean,
  plan: string | undefined | null,
) {
  return !membersOnly || isMember(plan);
}
