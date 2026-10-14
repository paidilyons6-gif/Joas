import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import { joinWaitlist } from "../../lib/waitlist";
import {
  fetchBroadcastOverview,
  runBroadcast,
  sendBroadcastTest,
  startBroadcast,
  type BroadcastJobSummary,
  type BroadcastOverview,
} from "../../lib/broadcastRepo";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Coach-only: email everyone, or just the people on one program. */
export function EmailingListPage() {
  const { user } = useAuth();
  const { preview, setPreview } = useClientPreview();
  const [overview, setOverview] = useState<BroadcastOverview | null>(null);
  const [audience, setAudience] = useState("everyone");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<BroadcastJobSummary | null>(null);

  const canLoad = !!user && isAdminEmail(user.email) && !preview;

  const load = useCallback(async () => {
    try {
      setOverview(await fetchBroadcastOverview());
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not load your lists.");
    }
  }, []);

  useEffect(() => {
    if (canLoad) void load();
  }, [canLoad, load]);

  if (!user) return <Navigate to="/sign-in" replace />;
  if (!isAdminEmail(user.email)) return <Navigate to="/portal" replace />;
  if (preview) {
    return (
      <div className="portal-page">
        <p className="eyebrow">Send an email</p>
        <h1>
          Coach tool — switch to <em>Coach view</em>
        </h1>
        <p className="portal-lede">
          Clients never see this page. Flip back to Coach view to send.
        </p>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => setPreview(false)}
        >
          Coach view →
        </button>
      </div>
    );
  }

  const selected = overview?.audiences.find((a) => a.id === audience);
  const running = progress?.status === "sending";

  async function send(jobId: string) {
    setBusy(true);
    setMsg("");
    try {
      const done = await runBroadcast(jobId, setProgress);
      setMsg(
        `Sent ${done.sent} of ${done.total}${done.failures.length ? ` — ${done.failures.length} couldn't be delivered` : ""} ♡`,
      );
      setSubject("");
      setBody("");
    } catch (err) {
      setMsg(
        `${err instanceof Error ? err.message : "Sending stopped."} You can resume it below.`,
      );
    } finally {
      setBusy(false);
      void load();
    }
  }

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (!subject.trim() || !body.trim()) {
      setMsg("Add a subject and message first.");
      return;
    }
    if (
      !confirm(
        `Send “${subject.trim()}” to ${selected.count} ${selected.count === 1 ? "person" : "people"} (${selected.label})?\n\nKeep this page open until it finishes.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const job = await startBroadcast(selected.id, subject.trim(), body.trim());
      setProgress(job);
      await send(job.id);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not send.");
      setBusy(false);
    }
  }

  async function onTest() {
    if (!subject.trim() || !body.trim()) {
      setMsg("Add a subject and message first.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await sendBroadcastTest(subject.trim(), body.trim());
      setMsg(`Test sent to ${res.sentTo} — check your inbox.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not send the test.");
    } finally {
      setBusy(false);
    }
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await joinWaitlist(addEmail.trim());
      setAddEmail("");
      setMsg("Added — they'll get emails sent to Everyone.");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not add that email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Coach · Send an email</p>
      <h1>
        Email <em>your people</em>
      </h1>
      <p className="portal-lede">
        Send to everyone on the site, or just the girls on one program. Each
        person gets their own email (nobody sees anyone else's address), with an
        unsubscribe link at the bottom.
      </p>

      {overview && !overview.mailReady && (
        <p className="form-error">
          Email isn't set up on Netlify yet (GMAIL_APP_PASSWORD).
        </p>
      )}

      <form className="studio-nav-settings" onSubmit={(e) => void onSend(e)}>
        <h2 className="portal-subhead">Who's it for?</h2>
        {!overview ? (
          <p className="module-card__meta">Loading your lists…</p>
        ) : (
          <div className="broadcast-audiences" role="radiogroup">
            {overview.audiences.map((a) => (
              <label
                key={a.id}
                className={`broadcast-audience ${audience === a.id ? "broadcast-audience--on" : ""}`}
              >
                <input
                  type="radio"
                  name="audience"
                  value={a.id}
                  checked={audience === a.id}
                  onChange={() => setAudience(a.id)}
                />
                <span>
                  <strong>{a.label}</strong>
                  <small>
                    {a.count} {a.count === 1 ? "person" : "people"}
                  </small>
                </span>
              </label>
            ))}
          </div>
        )}

        <h2 className="portal-subhead">Your email</h2>
        <label className="calc-field">
          <span>Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Day 2 is live in The Office ♡"
            required
          />
        </label>
        <label className="calc-field">
          <span>Message — type {"{name}"} and it becomes each person's first name</span>
          <textarea
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Hey {name},\n\n…\n\nBecca x"}
            required
          />
        </label>
        <div className="account-actions">
          <button
            className="btn btn--ghost-ink"
            type="button"
            disabled={busy}
            onClick={() => void onTest()}
          >
            Send me a test
          </button>
          <button
            className="btn btn--primary"
            type="submit"
            disabled={busy || !selected?.count}
          >
            {running
              ? "Sending…"
              : `Send to ${selected?.count ?? 0} ${selected?.count === 1 ? "person" : "people"} →`}
          </button>
        </div>
      </form>

      {progress && (
        <section className="studio-nav-settings">
          <h2 className="portal-subhead">
            {running ? "Sending… keep this page open" : "Sent ♡"}
          </h2>
          <div className="progress-bar" aria-hidden="true">
            <span
              style={{
                width: `${progress.total ? Math.round(((progress.total - progress.remaining) / progress.total) * 100) : 0}%`,
              }}
            />
          </div>
          <p className="module-card__meta">
            {progress.sent} of {progress.total} sent · {progress.audienceLabel}
          </p>
          {progress.failures.length > 0 && (
            <ul className="waitlist-export">
              {progress.failures.map((f) => (
                <li key={f.email}>
                  <strong>{f.email}</strong>
                  <span>{f.error}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {msg && <p className="form-status">{msg}</p>}

      {overview && overview.jobs.length > 0 && (
        <section className="studio-nav-settings">
          <h2 className="portal-subhead">Recent emails</h2>
          <ul className="waitlist-export">
            {overview.jobs.map((job) => (
              <li key={job.id}>
                <strong>{job.subject}</strong>
                <span>
                  {job.audienceLabel} · {formatWhen(job.createdAt)} · {job.sent}/
                  {job.total} sent
                  {job.failures.length ? ` · ${job.failures.length} failed` : ""}
                </span>
                {job.status === "sending" && !busy && (
                  <button
                    className="btn btn--ghost-ink"
                    type="button"
                    onClick={() => {
                      setProgress(job);
                      void send(job.id);
                    }}
                  >
                    Resume ({job.remaining} left) →
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form className="studio-nav-settings" onSubmit={(e) => void onAdd(e)}>
        <h2 className="portal-subhead">Add someone without an account</h2>
        <label className="calc-field">
          <span>Email (they'll be included in Everyone)</span>
          <input
            type="email"
            required
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="client@email.com"
          />
        </label>
        <button className="btn btn--ghost-ink" type="submit" disabled={busy}>
          Add →
        </button>
        {overview && overview.unsubscribed > 0 && (
          <p className="module-card__meta">
            {overview.unsubscribed} {overview.unsubscribed === 1 ? "person has" : "people have"} unsubscribed and won't be emailed.
          </p>
        )}
      </form>
    </div>
  );
}
