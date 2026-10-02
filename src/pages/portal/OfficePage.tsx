import { type FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import {
  createVillagePost,
  deleteVillagePost,
  listVillagePosts,
  setVillagePostPinned,
  type VillagePost,
} from "../../lib/villageRepo";
import { hasAnyProgram } from "../../lib/access";

/** Community feed — labeled Business Meeting (Village-style). */
export function OfficePage() {
  const { user } = useAuth();
  const { preview } = useClientPreview();
  if (!user) return <Navigate to="/sign-in" replace />;

  const [posts, setPosts] = useState<VillagePost[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const admin = isAdminEmail(user.email) && !preview;
  const member = hasAnyProgram(user.programs) || admin;

  async function refresh() {
    setPosts(await listVillagePosts());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setError("");
    setBusy(true);
    try {
      await createVillagePost({
        authorId: user.id,
        authorName: user.name,
        body,
      });
      setBody("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await deleteVillagePost(id);
    await refresh();
  }

  async function onPin(post: VillagePost) {
    setError("");
    try {
      await setVillagePostPinned(post.id, !post.pinned);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pin post");
    }
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Community</p>
      <h1>
        Business <em>Meeting</em>
      </h1>
      <p className="portal-lede">
        Your program community — share wins, ask questions, and get unstuck with
        other founders. Keep it real, keep it kind, keep it moving.
        {admin ? " Coach tip: pin posts to keep them at the top." : ""}
      </p>

      {!member && (
        <div className="upgrade-banner">
          <div>
            <h2>Buy a program to post in Business Meeting</h2>
            <p>
              Sign up free, get your program, then join the conversation here —
              like The Village, for business.
            </p>
          </div>
          <Link className="btn btn--primary" to="/programs">
            Shop programs →
          </Link>
        </div>
      )}

      {member && (
        <form className="office-composer" onSubmit={(e) => void onSubmit(e)}>
          <label className="calc-field">
            <span>Share with the meeting</span>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Win, question, or sticky problem…"
              maxLength={2000}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Posting…" : "Post →"}
          </button>
        </form>
      )}

      <div className="office-feed">
        {posts.length === 0 ? (
          <div className="studio-empty">
            <h3>No posts yet</h3>
            <p>Be the first to say hey and start the Business Meeting.</p>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className={`office-post ${post.pinned ? "office-post--pinned" : ""}`}
            >
              <div className="office-post__meta">
                <strong>{post.authorName}</strong>
                {post.pinned && <span className="office-post__pin-badge">Pinned</span>}
                <time dateTime={post.createdAt}>
                  {new Date(post.createdAt).toLocaleString()}
                </time>
              </div>
              <p>{post.body}</p>
              <div className="office-post__actions">
                {admin && (
                  <button
                    className="btn btn--ghost-ink"
                    type="button"
                    onClick={() => void onPin(post)}
                  >
                    {post.pinned ? "Unpin" : "Pin to top"}
                  </button>
                )}
                {(admin || post.authorId === user.id) && (
                  <button
                    className="btn btn--ghost-ink"
                    type="button"
                    onClick={() => void onDelete(post.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
