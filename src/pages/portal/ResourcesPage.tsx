import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { canAccessContent } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import {
  deleteVaultFile,
  fileKind,
  formatFileSize,
  listVault,
  moveVaultFile,
  updateVaultFile,
  uploadVaultFile,
  type VaultItem,
} from "../../lib/vaultRepo";

export function ResourcesPage() {
  const { user } = useAuth();
  const { preview } = useClientPreview();
  const [files, setFiles] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBlurb, setEditBlurb] = useState("");
  const userId = user?.id;

  const refresh = useCallback(async () => {
    try {
      const res = await listVault();
      setFiles(res.files);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the Vault.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    void refresh();
  }, [userId, refresh]);

  if (!user) return <Navigate to="/sign-in" replace />;
  const coach = isAdminEmail(user.email) && !preview;
  const member = canAccessContent(user.programs, { isAdmin: coach });

  async function run(task: () => Promise<unknown>, done?: string) {
    setBusy(true);
    setStatus("");
    try {
      await task();
      await refresh();
      if (done) setStatus(done);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    const form = event.currentTarget;
    void run(async () => {
      await uploadVaultFile(file, title || file.name.replace(/\.[^.]+$/, ""), blurb);
      setFile(null);
      setTitle("");
      setBlurb("");
      form.reset();
    }, "Added to the Vault ♡");
  }

  function startEdit(item: VaultItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditBlurb(item.blurb);
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Vault</p>
      <h1>
        Your <em>Vault</em>
      </h1>
      <p className="portal-lede">
        Slides, guides and downloads from your program, yours to keep.
      </p>

      {!member && (
        <div className="upgrade-banner">
          <div>
            <h2>The Vault unlocks with a program</h2>
            <p>Buy a program to download everything in here.</p>
          </div>
          <Link className="btn btn--primary" to="/programs">
            Shop programs →
          </Link>
        </div>
      )}

      {coach && (
        <form className="lesson-panel vault-upload" onSubmit={onUpload}>
          <h2>Add a file</h2>
          <label className="calc-field">
            <span>File (PDF, PowerPoint, Keynote, Word, images, up to 50 MB)</span>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="calc-field">
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={file ? file.name.replace(/\.[^.]+$/, "") : "e.g. Day 1 · SEEN slides"}
            />
          </label>
          <label className="calc-field">
            <span>Short description (optional)</span>
            <input value={blurb} onChange={(e) => setBlurb(e.target.value)} />
          </label>
          <div className="account-actions">
            <button className="btn btn--primary" type="submit" disabled={busy || !file}>
              {busy ? "Working…" : "Upload →"}
            </button>
            {status && <p className="form-status">{status}</p>}
          </div>
        </form>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="vault-list">
        {loading ? (
          <p className="module-card__meta">Loading…</p>
        ) : files.length === 0 ? (
          <div className="studio-empty">
            <h3>Nothing here yet</h3>
            <p>
              {coach
                ? "Upload your first file above."
                : "New downloads will appear here."}
            </p>
          </div>
        ) : (
          files.map((item, index) => {
            const editing = editingId === item.id;
            return (
              <article
                key={item.id}
                className={`vault-card ${member ? "" : "module-card--locked"}`}
              >
                <div className="vault-card__top">
                  <div>
                    <p className="module-card__phase">
                      {fileKind(item.fileName)}
                      {item.size ? ` · ${formatFileSize(item.size)}` : ""}
                    </p>
                    {editing ? (
                      <>
                        <label className="calc-field">
                          <span>Title</span>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                          />
                        </label>
                        <label className="calc-field">
                          <span>Short description</span>
                          <input
                            value={editBlurb}
                            onChange={(e) => setEditBlurb(e.target.value)}
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <h3>{item.title}</h3>
                        {item.blurb && <p>{item.blurb}</p>}
                      </>
                    )}
                  </div>
                  {!member ? (
                    <Link className="btn btn--primary" to="/programs">
                      Unlock →
                    </Link>
                  ) : (
                    item.url && (
                      <a className="btn btn--ink" href={item.url}>
                        Download ↓
                      </a>
                    )
                  )}
                </div>
                {coach && (
                  <div className="account-actions vault-card__coach">
                    {editing ? (
                      <>
                        <button
                          className="btn btn--primary"
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await updateVaultFile(item.id, editTitle, editBlurb);
                              setEditingId(null);
                            }, "Saved ♡")
                          }
                        >
                          Save
                        </button>
                        <button
                          className="btn btn--ghost-ink"
                          type="button"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn--ghost-ink"
                        type="button"
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      className="btn btn--ghost-ink"
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() => void run(() => moveVaultFile(item.id, "up"))}
                    >
                      ↑
                    </button>
                    <button
                      className="btn btn--ghost-ink"
                      type="button"
                      disabled={busy || index === files.length - 1}
                      onClick={() => void run(() => moveVaultFile(item.id, "down"))}
                    >
                      ↓
                    </button>
                    <button
                      className="btn btn--ghost-ink"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (!confirm(`Delete “${item.title}” from the Vault?`)) return;
                        void run(() => deleteVaultFile(item.id), "Deleted");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
