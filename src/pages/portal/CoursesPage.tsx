import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  invalidateCatalog,
  trackProgressFromTrack,
  usePublishedTracks,
} from "../../lib/courseCatalog";
import { useAuth } from "../../lib/auth";
import { hasAnyProgram } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import {
  listProgramsForStudio,
  studioStore,
  type StudioTrack,
} from "../../lib/studio";
import { fetchTracks, saveStudioTrackRemote } from "../../lib/coursesRepo";
import type { CourseTrack } from "../../data/courses";
import { coursesAreOpen, coursesOpenLabel } from "../../lib/coursesOpen";

type CoachRow = {
  track: CourseTrack;
  studio?: StudioTrack;
  published: boolean;
};

export function CoursesPage() {
  const { user } = useAuth();
  const { preview } = useClientPreview();
  const published = usePublishedTracks();
  const [coachRows, setCoachRows] = useState<CoachRow[]>([]);
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState("");
  const member = hasAnyProgram(user?.programs);
  const admin = !!user && isAdminEmail(user.email) && !preview;

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    void (async () => {
      const remote = await fetchTracks({ includeDrafts: true });
      const studioList = studioStore.list();
      const rows: CoachRow[] = [];
      for (const row of listProgramsForStudio()) {
        const studio = studioList.find((t) => t.id === row.editableId);
        const fromRemote = remote.find((t) => t.id === row.id);
        const track: CourseTrack | null = fromRemote
          ? fromRemote
          : studio
            ? {
                id: studio.id,
                title: studio.title,
                blurb: studio.blurb,
                badge: studio.badge,
                membersOnly: studio.membersOnly,
                lessons: studio.lessons,
              }
            : null;
        if (!track) continue;
        rows.push({ track, studio, published: row.published });
      }
      if (!cancelled) setCoachRows(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [admin, published.tracks]);

  async function toggleLive(row: CoachRow) {
    setBusyId(row.track.id);
    setStatus("");
    try {
      let studio = row.studio || studioStore.getTrack(row.track.id);
      if (!studio) {
        studio = studioStore.editBuiltin(row.track.id);
      }
      const next: StudioTrack = {
        ...studio,
        published: !row.published,
        badge: !row.published
          ? studio.overridesId
            ? studio.badge
            : "Member course"
          : "Draft",
      };
      await saveStudioTrackRemote(next);
      invalidateCatalog();
      setStatus(
        next.published ? "Course is LIVE for clients ♡" : "Course hidden (draft)",
      );
      setCoachRows((prev) =>
        prev.map((r) =>
          r.track.id === row.track.id
            ? { ...r, studio: next, published: next.published }
            : r,
        ),
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusyId("");
    }
  }

  const loading = admin ? false : published.loading;
  const empty = admin ? coachRows.length === 0 : published.tracks.length === 0;

  if (!user) return <Navigate to="/sign-in" replace />;

  const waitingForOpen = member && !admin && !coursesAreOpen();

  if (waitingForOpen) {
    return (
      <div className="portal-page">
        <p className="eyebrow">Courses</p>
        <h1>
          Seen. Heard. <em>Earn.</em>
        </h1>
        <div className="courses-coming">
          <p className="courses-coming__date">{coursesOpenLabel()}</p>
          <p className="portal-lede">
            You’re in — The Office platform is unlocked. Course training opens
            October 14th. Until then, use Toolkit, Calculators, and Business
            Meeting.
          </p>
          <div className="account-actions">
            <Link className="btn btn--primary" to="/portal/tools">
              Open Toolkit →
            </Link>
            <Link className="btn btn--ink" to="/portal">
              Back to portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <div className="portal-page__head-row">
        <div>
          <p className="eyebrow">Courses</p>
          <h1>
            Train like you mean <em>business</em>
          </h1>
          <p className="portal-lede">
            {admin
              ? "Edit and choose which courses are LIVE for clients."
              : "Follow the courses Becca builds in Studio — with video on each part when she adds it."}
          </p>
        </div>
        {admin && (
          <Link className="btn btn--primary" to="/portal/studio">
            Create course →
          </Link>
        )}
      </div>

      {status && <p className="form-status">{status}</p>}

      {loading && <p className="portal-lede">Loading courses…</p>}
      {!loading && empty && (
        <div className="studio-empty">
          <h3>No courses yet</h3>
          <p>
            {admin
              ? "Create and publish a course in Studio — members will follow that."
              : "Becca is adding your program courses. Check back soon."}
          </p>
          {admin && (
            <Link className="btn btn--primary" to="/portal/studio">
              Open Studio →
            </Link>
          )}
        </div>
      )}

      <div className="module-grid module-grid--desktop">
        {admin
          ? coachRows.map((row) => {
              const { track, published: isLive } = row;
              const progress = trackProgressFromTrack(
                track,
                user.completedLessons,
              );
              const locked = track.membersOnly && !member && !admin;
              const minutes = track.lessons.reduce(
                (sum, l) => sum + l.duration,
                0,
              );
              return (
                <article
                  key={track.id}
                  className={`module-card module-card--tall ${locked ? "module-card--locked" : ""} ${!isLive ? "module-card--draft" : ""}`}
                >
                  <p className="module-card__phase">{isLive ? "LIVE" : "Draft"}</p>
                  <h3>{track.title}</h3>
                  <p>{track.blurb}</p>
                  <p className="module-card__meta">
                    {track.lessons.length} lessons · ~{minutes} min
                  </p>
                  <div className="progress-bar" aria-hidden="true">
                    <span style={{ width: `${progress.pct}%` }} />
                  </div>
                  <p className="module-card__meta">{progress.pct}% complete</p>
                  <div className="module-card__actions">
                    {locked ? (
                      <Link className="btn btn--primary" to="/programs">
                        Unlock track →
                      </Link>
                    ) : (
                      <Link
                        className="btn btn--ink"
                        to={`/portal/courses/${track.id}`}
                      >
                        Open track →
                      </Link>
                    )}
                    <button
                      className={`btn ${isLive ? "btn--ghost-ink" : "btn--primary"}`}
                      type="button"
                      disabled={busyId === track.id}
                      onClick={() => void toggleLive(row)}
                    >
                      {busyId === track.id
                        ? "Saving…"
                        : isLive
                          ? "Set draft"
                          : "Make LIVE →"}
                    </button>
                    <Link
                      className="btn btn--ghost-ink"
                      to={`/portal/studio/${track.id}`}
                    >
                      Edit →
                    </Link>
                  </div>
                </article>
              );
            })
          : published.tracks.map((track) => {
              const progress = trackProgressFromTrack(
                track,
                user.completedLessons,
              );
              const locked = track.membersOnly && !member;
              const minutes = track.lessons.reduce(
                (sum, l) => sum + l.duration,
                0,
              );
              return (
                <article
                  key={track.id}
                  className={`module-card module-card--tall ${locked ? "module-card--locked" : ""}`}
                >
                  <p className="module-card__phase">{track.badge}</p>
                  <h3>{track.title}</h3>
                  <p>{track.blurb}</p>
                  <p className="module-card__meta">
                    {track.lessons.length} lessons · ~{minutes} min
                  </p>
                  <div className="progress-bar" aria-hidden="true">
                    <span style={{ width: `${progress.pct}%` }} />
                  </div>
                  <p className="module-card__meta">{progress.pct}% complete</p>
                  {locked ? (
                    <Link className="btn btn--primary" to="/programs">
                      Unlock track →
                    </Link>
                  ) : (
                    <Link
                      className="btn btn--ink"
                      to={`/portal/courses/${track.id}`}
                    >
                      Open track →
                    </Link>
                  )}
                </article>
              );
            })}
      </div>
    </div>
  );
}
