import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { VideoPlayer } from "../../components/VideoPlayer";
import { useAuth } from "../../lib/auth";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import {
  createVillagePost,
  deleteVillagePost,
  listVillagePosts,
  MAX_POST_PHOTOS,
  setVillagePostPinned,
  type VillagePost,
} from "../../lib/villageRepo";
import { hasAnyProgram } from "../../lib/access";

/** Community feed — labeled The Office (Village-style). */
export function OfficePage() {
  const { user } = useAuth();
  const { preview } = useClientPreview();
  const [posts, setPosts] = useState<VillagePost[]>([]);
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setPosts(await listVillagePosts("office"));
  }

  useEffect(() => {
    void refresh();
  }, []);

  if (!user) return <Navigate to="/sign-in" replace />;

  const admin = isAdminEmail(user.email) && !preview;
  const member = hasAnyProgram(user.programs) || admin;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (busy) return;
    const sentBody = body;
    const sentVideo = videoUrl;
    const sent = photos;
    setError("");
    setBusy(true);
    try {
      await createVillagePost({
        authorId: user.id,
        authorName: user.name,
        body: sentBody,
        photos: sent.map((p) => p.file),
        videoUrl: sentVideo,
        channel: "office",
      });
      setBody((current) => (current === sentBody ? "" : current));
      setVideoUrl((current) => (current === sentVideo ? "" : current));
      sent.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos((current) => current.filter((p) => !sent.includes(p)));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post");
    } finally {
      setBusy(false);
    }
  }

  function onPickPhotos(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files || []).filter((f) =>
      f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name),
    );
    event.target.value = "";
    const room = MAX_POST_PHOTOS - photos.length;
    if (picked.length > room) {
      setError(`Up to ${MAX_POST_PHOTOS} photos per post.`);
    }
    setPhotos((prev) => [
      ...prev,
      ...picked.slice(0, Math.max(0, room)).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function onDelete(post: VillagePost) {
    if (!confirm("Delete this post?")) return;
    setError("");
    try {
      await deleteVillagePost(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete post");
    }
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
        The <em>Office</em>
      </h1>
      <p className="portal-lede">
        Your program community — share wins, ask questions, and get unstuck with
        other founders. Keep it real, keep it kind, keep it moving.
        {admin ? " Coach tip: pin posts to keep them at the top." : ""}
      </p>

      {!member && (
        <div className="upgrade-banner">
          <div>
            <h2>Buy a program to post in The Office</h2>
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
              required={photos.length === 0 && !videoUrl.trim()}
            />
          </label>
          <label className="calc-field">
            <span>Video link (optional — Bunny.net play or embed link)</span>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://iframe.mediadelivery.net/play/…"
              maxLength={2000}
            />
          </label>
          {photos.length > 0 && (
            <div className="office-composer__photos">
              {photos.map((p, index) => (
                <div className="office-composer__photo" key={p.preview}>
                  <img src={p.preview} alt={`Photo ${index + 1}`} />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => removePhoto(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="account-actions">
            <label
              className={`btn btn--ghost-ink office-composer__add ${photos.length >= MAX_POST_PHOTOS ? "is-disabled" : ""}`}
            >
              + Add photos
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={busy || photos.length >= MAX_POST_PHOTOS}
                onChange={onPickPhotos}
              />
            </label>
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? (photos.length ? "Uploading…" : "Posting…") : "Post →"}
            </button>
          </div>
        </form>
      )}

      <div className="office-feed">
        {posts.length === 0 ? (
          <div className="studio-empty">
            <h3>No posts yet</h3>
            <p>Be the first to say hey and get The Office talking.</p>
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
              {post.body && <p>{post.body}</p>}
              {post.videoUrl && (
                <VideoPlayer
                  url={post.videoUrl}
                  title={`Video from ${post.authorName}`}
                  className="office-post__video"
                />
              )}
              {post.imageUrls.some(Boolean) && (
                <div
                  className={`office-post__photos office-post__photos--${Math.min(post.imageUrls.length, 4)}`}
                >
                  {post.imageUrls.map((src, index) =>
                    src ? (
                      <a key={src} href={src} target="_blank" rel="noreferrer">
                        <img
                          src={src}
                          alt={`Photo ${index + 1} from ${post.authorName}`}
                          loading="lazy"
                        />
                      </a>
                    ) : null,
                  )}
                </div>
              )}
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
                    onClick={() => void onDelete(post)}
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
