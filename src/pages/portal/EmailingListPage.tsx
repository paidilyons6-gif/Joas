import { type FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import {
  fetchWaitlist,
  joinWaitlist,
  sendWaitlistAnnounce,
  type WaitlistRow,
} from "../../lib/waitlist";

const PRICE_SECRET_KEY = "bbb_studio_price_secret";

/** Coach-only: email everyone on the list (subject + body). */
export function EmailingListPage() {
  const { user } = useAuth();
  const { preview, setPreview } = useClientPreview();
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [priceSecret, setPriceSecret] = useState(() => {
    try {
      return sessionStorage.getItem(PRICE_SECRET_KEY) || "";
    } catch {
      return "";
    }
  });

  if (!user) return <Navigate to="/sign-in" replace />;
  const isAdmin = isAdminEmail(user.email);
  if (!isAdmin) return <Navigate to="/portal" replace />;
  if (preview) {
    return (
      <div className="portal-page">
        <p className="eyebrow">Emailing list</p>
        <h1>
          Coach tool — switch to <em>Coach view</em>
        </h1>
        <p className="portal-lede">
          Clients never see the emailing list. Flip back to Coach view to send.
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

  async function loadList() {
    setMsg("");
    setBusy(true);
    try {
      if (priceSecret.trim()) {
        try {
          sessionStorage.setItem(PRICE_SECRET_KEY, priceSecret.trim());
        } catch {
          /* ignore */
        }
      }
      const list = await fetchWaitlist({
        email: user!.email,
        secret: priceSecret.trim(),
      });
      setRows(list);
      setMsg(
        list.length
          ? `${list.length} email${list.length === 1 ? "" : "s"} on the list.`
          : "List is empty — add emails below (no public collection).",
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not load list");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      await joinWaitlist(addEmail.trim());
      setAddEmail("");
      await loadList();
      setMsg("Email added to the list.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not add email");
      setBusy(false);
    }
  }

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setMsg("Add a subject and email body first.");
      return;
    }
    if (!priceSecret.trim()) {
      setMsg("Enter your Studio password (same as pricing) to send.");
      return;
    }
    if (
      !confirm(
        `Send this email from paidilyons6@gmail.com to ${rows.length || "everyone on"} the list?`,
      )
    ) {
      return;
    }
    setMsg("");
    setBusy(true);
    try {
      try {
        sessionStorage.setItem(PRICE_SECRET_KEY, priceSecret.trim());
      } catch {
        /* ignore */
      }
      const result = await sendWaitlistAnnounce({
        email: user!.email,
        secret: priceSecret.trim(),
        subject: subject.trim(),
        body: body.trim(),
      });
      setMsg(
        `Sent ${result.sent}/${result.total} from paidilyons6@gmail.com.`,
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Coach · Emailing list</p>
      <h1>
        Email <em>everyone</em>
      </h1>
      <p className="portal-lede">
        No public signup form — you add emails here, then send with a subject
        and message. From paidilyons6@gmail.com.
      </p>

      <section className="studio-nav-settings">
        <label className="calc-field">
          <span>Studio password (to load &amp; send)</span>
          <input
            type="password"
            value={priceSecret}
            onChange={(e) => setPriceSecret(e.target.value)}
            placeholder="Same password as Studio pricing"
            autoComplete="current-password"
          />
        </label>
        <div className="account-actions">
          <button
            className="btn btn--ink"
            type="button"
            disabled={busy}
            onClick={() => void loadList()}
          >
            {busy ? "Loading…" : "Refresh list →"}
          </button>
          <Link className="btn btn--ghost-ink" to="/portal/studio">
            Open Studio →
          </Link>
        </div>
      </section>

      <form className="studio-nav-settings" onSubmit={(e) => void onAdd(e)}>
        <h2 className="portal-subhead">Add email</h2>
        <label className="calc-field">
          <span>Email</span>
          <input
            type="email"
            required
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="client@email.com"
          />
        </label>
        <button className="btn btn--primary" type="submit" disabled={busy}>
          Add to list →
        </button>
      </form>

      <form className="studio-nav-settings" onSubmit={(e) => void onSend(e)}>
        <h2 className="portal-subhead">Compose</h2>
        <label className="calc-field">
          <span>Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What’s new in The Office"
            required
          />
        </label>
        <label className="calc-field">
          <span>Email</span>
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the email your list will receive…"
            required
          />
        </label>
        <button
          className="btn btn--primary"
          type="submit"
          disabled={busy || !rows.length}
        >
          {busy ? "Sending…" : `Send to ${rows.length || 0} →`}
        </button>
      </form>

      {msg && <p className="form-status">{msg}</p>}

      {rows.length > 0 && (
        <ul className="waitlist-export">
          {rows.map((row) => (
            <li key={`${row.email}-${row.created_at}`}>
              <strong>{row.email}</strong>
              <span>
                {row.source} ·{" "}
                {new Date(row.created_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
