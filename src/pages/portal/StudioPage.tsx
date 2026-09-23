import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { isAdminEmail } from "../../lib/admin";
import {
  DEFAULT_NAV,
  emptyLesson,
  emptyTrack,
  listProgramsForStudio,
  NAV_META,
  studioStore,
  type NavSettings,
  type NavTopicId,
  type StudioLesson,
  type StudioTrack,
} from "../../lib/studio";
import {
  deleteStudioTrackRemote,
  saveNavSettingsRemote,
  saveSiteCopyRemote,
  saveStudioTrackRemote,
  fetchSiteCopy,
} from "../../lib/coursesRepo";
import {
  DEFAULT_SITE_COPY,
  type SiteCopy,
} from "../../lib/siteCopy";

export function StudioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!isAdminEmail(user.email)) return <Navigate to="/portal" replace />;

  const [programs, setPrograms] = useState(listProgramsForStudio());
  const [nav, setNav] = useState<NavSettings>(DEFAULT_NAV);
  const [navSaved, setNavSaved] = useState("");
  const [copy, setCopy] = useState<SiteCopy>(DEFAULT_SITE_COPY);
  const [copySaved, setCopySaved] = useState("");

  function refresh() {
    setPrograms(listProgramsForStudio());
    setNav(studioStore.getNavSettings());
  }

  useEffect(() => {
    refresh();
    void fetchSiteCopy().then(setCopy);
  }, []);

  function createCourse() {
    const track = emptyTrack();
    void saveStudioTrackRemote(track).then(() => {
      refresh();
      navigate(`/portal/studio/${track.id}`);
    });
  }

  function editProgram(editableId: string, source: "builtin" | "studio") {
    if (source === "builtin") {
      const track = studioStore.editBuiltin(editableId);
      navigate(`/portal/studio/${track.id}`);
      return;
    }
    navigate(`/portal/studio/${editableId}`);
  }

  function remove(id: string, source: "builtin" | "studio") {
    if (source === "builtin") {
      alert("Built-in programs stay in the library. Edit them instead of deleting.");
      return;
    }
    if (!confirm("Delete this custom course? This cannot be undone.")) return;
    void deleteStudioTrackRemote(id).then(() => refresh());
  }

  function toggleNav(id: NavTopicId) {
    if (id === "studio" || id === "home" || id === "account") {
      if (id === "studio") return;
    }
    const next = { ...nav, [id]: !nav[id] };
    setNav(next);
  }

  function saveNav() {
    void saveNavSettingsRemote(nav).then(() => {
      setNavSaved("Menu topics updated ♡");
      window.setTimeout(() => setNavSaved(""), 2000);
    });
  }

  function updateCopy<K extends keyof SiteCopy>(key: K, value: SiteCopy[K]) {
    setCopy((prev) => ({ ...prev, [key]: value }));
  }

  function saveCopy() {
    void saveSiteCopyRemote(copy).then(() => {
      setCopySaved("Homepage writing saved ♡ — refresh the home page to see it.");
      window.setTimeout(() => setCopySaved(""), 3000);
    });
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Studio</p>
      <h1>
        Edit programs &amp; <em>writing</em>
      </h1>
      <p className="portal-lede">
        Change homepage copy, courses, lessons, and which menu topics members
        see — signed in as admin ({user.email}).
      </p>

      <section className="studio-nav-settings">
        <h2 className="portal-subhead">Homepage writing</h2>
        <p className="portal-lede">
          Edit the words visitors see on the landing page (hero, manifesto, and
          more). Save, then open the home page.
        </p>
        <div className="tool-form">
          {(
            [
              ["heroHeadline", "Hero headline"],
              ["heroLede", "Hero supporting sentence"],
              ["heroCtaGuest", "Primary button (logged out)"],
              ["heroCtaMember", "Primary button (logged in)"],
              ["heroCtaSecondary", "Secondary button"],
              ["manifestoEyebrow", "Manifesto eyebrow"],
              ["manifestoTitle", "Manifesto title"],
              ["manifestoAccent", "Manifesto accent line"],
              ["manifestoCopy", "Manifesto paragraph"],
              ["pillarsEyebrow", "Pillars eyebrow"],
              ["pillarsTitle", "Pillars title"],
              ["pillarsTitleEm", "Pillars italic word"],
              ["pillarsCopy", "Pillars paragraph"],
              ["bandTitle", "Band title"],
              ["bandTitleEm", "Band italic ending"],
              ["bandCopy", "Band paragraph"],
              ["offerEyebrow", "Offer eyebrow"],
              ["offerTitle", "Offer title"],
              ["offerTitleEm", "Offer italic word"],
              ["offerCopy", "Offer paragraph"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="calc-field">
              <span>{label}</span>
              {key.includes("Copy") || key.includes("Lede") || key === "manifestoCopy" || key === "pillarsCopy" || key === "bandCopy" || key === "offerCopy" ? (
                <textarea
                  rows={3}
                  value={copy[key]}
                  onChange={(e) => updateCopy(key, e.target.value)}
                />
              ) : (
                <input
                  value={copy[key]}
                  onChange={(e) => updateCopy(key, e.target.value)}
                />
              )}
            </label>
          ))}
          <label className="calc-field">
            <span>Checklist (one item per line)</span>
            <textarea
              rows={6}
              value={copy.checklist.join("\n")}
              onChange={(e) =>
                updateCopy(
                  "checklist",
                  e.target.value
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean),
                )
              }
            />
          </label>
          <div className="account-actions">
            <button className="btn btn--primary" type="button" onClick={saveCopy}>
              Save homepage writing →
            </button>
            {copySaved && <p className="form-status">{copySaved}</p>}
          </div>
        </div>
      </section>

      <div className="studio-hero">
        <div>
          <h2>Programs on the site</h2>
          <p>
            Edit Startup Foundations, Money &amp; Margins, Launch &amp; Sales, or
            add new courses for members.
          </p>
        </div>
        <button className="btn btn--primary" type="button" onClick={createCourse}>
          New course →
        </button>
      </div>

      <div className="module-grid">
        {programs.map((program) => (
          <article key={program.id} className="module-card module-card--tall">
            <p className="module-card__phase">
              {program.source === "builtin" ? "Built-in" : program.published ? "Published" : "Draft"}
            </p>
            <h3>{program.title}</h3>
            <p>{program.blurb}</p>
            <p className="module-card__meta">
              {program.lessonCount} lessons · tap Edit to change content
            </p>
            <div className="account-actions">
              <button
                className="btn btn--ink"
                type="button"
                onClick={() => editProgram(program.editableId, program.source)}
              >
                Edit program →
              </button>
              {program.source === "studio" && (
                <button
                  className="btn btn--ghost-ink"
                  type="button"
                  onClick={() => remove(program.editableId, program.source)}
                >
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <section className="studio-nav-settings">
        <h2 className="portal-subhead">Menu topics shown</h2>
        <p className="portal-lede">
          Turn topics on or off in the portal menu. Studio always stays
          visible for you as admin.
        </p>
        <div className="nav-toggle-grid">
          {NAV_META.map((item) => (
            <label key={item.id} className="nav-toggle">
              <input
                type="checkbox"
                checked={item.id === "studio" ? true : nav[item.id] !== false}
                disabled={item.id === "studio"}
                onChange={() => toggleNav(item.id)}
              />
              <span>
                <strong>{item.label}</strong>
                <small>{item.group}</small>
              </span>
            </label>
          ))}
        </div>
        <div className="account-actions">
          <button className="btn btn--primary" type="button" onClick={saveNav}>
            Save menu topics
          </button>
          {navSaved && <p className="form-status">{navSaved}</p>}
        </div>
      </section>
    </div>
  );
}

export function StudioEditorPage() {
  const { trackId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!isAdminEmail(user.email)) return <Navigate to="/portal" replace />;

  const existing = trackId ? studioStore.getTrack(trackId) : null;
  const [track, setTrack] = useState<StudioTrack | null>(existing);
  const [activeLesson, setActiveLesson] = useState(0);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!trackId) {
      navigate("/portal/studio");
      return;
    }
    let found = studioStore.getTrack(trackId);
    if (!found) {
      try {
        found = studioStore.editBuiltin(trackId);
      } catch {
        navigate("/portal/studio");
        return;
      }
    }
    setTrack(found);
  }, [trackId, navigate]);

  if (!track) return <div className="loading-screen">Loading program…</div>;

  const current = track;
  const lesson = current.lessons[activeLesson] || current.lessons[0];

  function updateTrack(patch: Partial<StudioTrack>) {
    setTrack((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updateLesson(patch: Partial<StudioLesson>) {
    setTrack((prev) => {
      if (!prev) return prev;
      const lessons = prev.lessons.map((l, i) =>
        i === activeLesson ? { ...l, ...patch } : l,
      );
      return { ...prev, lessons };
    });
  }

  function updateSection(index: number, patch: { heading?: string; body?: string }) {
    if (!lesson) return;
    const sections = lesson.sections.map((s, i) =>
      i === index ? { ...s, ...patch } : s,
    );
    updateLesson({ sections });
  }

  function addLesson() {
    const id = `${current.id}-l${current.lessons.length + 1}-${crypto.randomUUID().slice(0, 4)}`;
    const next = [...current.lessons, emptyLesson(id)];
    updateTrack({ lessons: next });
    setActiveLesson(next.length - 1);
  }

  function removeLesson() {
    if (current.lessons.length <= 1) {
      alert("Keep at least one lesson in the program.");
      return;
    }
    if (!confirm("Delete this lesson?")) return;
    const next = current.lessons.filter((_, i) => i !== activeLesson);
    updateTrack({ lessons: next });
    setActiveLesson(Math.max(0, activeLesson - 1));
  }

  function addSection() {
    if (!lesson) return;
    updateLesson({
      sections: [
        ...lesson.sections,
        { heading: "New section", body: "Write content…" },
      ],
    });
  }

  function onSave(event: FormEvent) {
    event.preventDefault();
    void saveStudioTrackRemote(current).then(() => {
      setSaved("Program & lessons saved ♡");
      window.setTimeout(() => setSaved(""), 2200);
    });
  }

  function publishToggle() {
    const next: StudioTrack = {
      ...current,
      published: !current.published,
      badge: !current.published
        ? current.overridesId
          ? current.badge
          : "Member course"
        : "Draft",
    };
    setTrack(next);
    void saveStudioTrackRemote(next).then(() => {
      setSaved(next.published ? "Live for members ♡" : "Hidden as draft");
      window.setTimeout(() => setSaved(""), 2200);
    });
  }

  return (
    <div className="portal-page studio-editor">
      <Link className="back-link" to="/portal/studio">
        ← All programs
      </Link>
      <div className="studio-editor__head">
        <div>
          <p className="eyebrow">Program editor</p>
          <h1>
            Edit <em>lessons</em>
          </h1>
          <p className="portal-lede">
            Change titles, teaching content, actions, and worksheets for each
            lesson.
          </p>
        </div>
        <div className="account-actions">
          <button className="btn btn--ghost-ink" type="button" onClick={publishToggle}>
            {current.published ? "Unpublish" : "Publish"}
          </button>
          <button className="btn btn--primary" type="button" onClick={onSave}>
            Save changes
          </button>
        </div>
      </div>
      {saved && <p className="form-status">{saved}</p>}

      <form className="studio-layout" onSubmit={onSave}>
        <aside className="studio-sidebar">
          <label className="calc-field">
            <span>Program title</span>
            <input
              value={current.title}
              onChange={(e) => updateTrack({ title: e.target.value })}
              required
            />
          </label>
          <label className="calc-field">
            <span>Short description</span>
            <textarea
              rows={3}
              value={current.blurb}
              onChange={(e) => updateTrack({ blurb: e.target.value })}
            />
          </label>
          <label className="check-item">
            <input
              type="checkbox"
              checked={current.membersOnly}
              onChange={(e) => updateTrack({ membersOnly: e.target.checked })}
            />
            <span>Members only</span>
          </label>

          <p className="portal-subhead">Lessons</p>
          <div className="studio-lesson-list">
            {current.lessons.map((l, i) => (
              <button
                key={l.id}
                type="button"
                className={`studio-lesson-tab ${i === activeLesson ? "is-active" : ""}`}
                onClick={() => setActiveLesson(i)}
              >
                {i + 1}. {l.title || "Untitled"}
              </button>
            ))}
          </div>
          <div className="account-actions">
            <button className="btn btn--ink" type="button" onClick={addLesson}>
              + Add lesson
            </button>
            <button className="btn btn--ghost-ink" type="button" onClick={removeLesson}>
              Delete lesson
            </button>
          </div>
        </aside>

        {lesson && (
          <div className="studio-canvas">
            <label className="calc-field">
              <span>Lesson title</span>
              <input
                value={lesson.title}
                onChange={(e) => updateLesson({ title: e.target.value })}
              />
            </label>
            <label className="calc-field">
              <span>Duration (minutes)</span>
              <input
                type="number"
                min={1}
                value={lesson.duration}
                onChange={(e) =>
                  updateLesson({ duration: Number(e.target.value) || 1 })
                }
              />
            </label>
            <label className="check-item">
              <input
                type="checkbox"
                checked={lesson.membersOnly}
                onChange={(e) =>
                  updateLesson({ membersOnly: e.target.checked })
                }
              />
              <span>This lesson is members only</span>
            </label>
            <label className="calc-field">
              <span>Objectives (one per line)</span>
              <textarea
                rows={3}
                value={lesson.objectives.join("\n")}
                onChange={(e) =>
                  updateLesson({
                    objectives: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>

            {lesson.sections.map((section, index) => (
              <div className="lesson-panel" key={`${lesson.id}-s${index}`}>
                <label className="calc-field">
                  <span>Section heading</span>
                  <input
                    value={section.heading}
                    onChange={(e) =>
                      updateSection(index, { heading: e.target.value })
                    }
                  />
                </label>
                <label className="calc-field">
                  <span>Section body</span>
                  <textarea
                    rows={5}
                    value={section.body}
                    onChange={(e) =>
                      updateSection(index, { body: e.target.value })
                    }
                  />
                </label>
              </div>
            ))}
            <button className="btn btn--ghost-ink" type="button" onClick={addSection}>
              + Add section
            </button>

            <label className="calc-field">
              <span>Do this now</span>
              <textarea
                rows={2}
                value={lesson.action}
                onChange={(e) => updateLesson({ action: e.target.value })}
              />
            </label>
            <label className="calc-field">
              <span>Worksheet prompt</span>
              <textarea
                rows={2}
                value={lesson.worksheetPrompt}
                onChange={(e) =>
                  updateLesson({ worksheetPrompt: e.target.value })
                }
              />
            </label>
          </div>
        )}
      </form>
    </div>
  );
}
