/** Courses unlock for purchasers on this date (Europe/Dublin). */
export const COURSES_OPEN_ISO = "2026-10-13T18:30:00+01:00";

export function getCoursesOpenDate() {
  return new Date(COURSES_OPEN_ISO);
}

/** True once courses are live for members (admins bypass in Coach view). */
export function coursesAreOpen(now = new Date()) {
  return now.getTime() >= getCoursesOpenDate().getTime();
}

export function coursesOpenLabel() {
  return "Opens October 14th";
}
