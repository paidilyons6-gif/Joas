import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { Link, Navigate } from "react-router-dom";
import { VideoPlayer } from "../../components/VideoPlayer";
import { useAuth } from "../../lib/auth";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import {
  createVillagePost,
  deleteVillagePost,
  listOfficeThreads,
  LIKES_SQL_HINT,
  MAX_POST_PHOTOS,
  setVillagePostPinned,
  toggleVillageLike,
  type EngagedPost,
  type OfficeComment,
  type OfficeThread,
  type VillagePost,
} from "../../lib/villageRepo";
import { hasAnyProgram } from "../../lib/access";

function isCoachName(name: string) {
  return /becca/i.test(name);
}

function PostBody({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > 320;
  const shown = !long || open ? text : `${text.slice(0, 300).trim()}…`;
  return (
    <div className="office-post__body">
      <p>{shown}</p>
      {long && (
        <button
          type="button"
          className="office-post__more"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function PostMedia({ post }: { post: VillagePost }) {
  return (
    <>
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
    </>
  );
}

function likeLabel(post: EngagedPost) {
  if (!post.likeCount) return "";
  if (post.likedByMe && post.likeCount === 1) return "You liked this";
  if (post.likedByMe) {
    const others = post.likedBy.filter((n) => !/you/i.test(n));
    if (post.likeCount === 2 && others[0]) return `You and ${others[0]}`;
    return `You and ${post.likeCount - 1} other${post.likeCount - 1 === 1 ? "" : "s"}`;
  }
  if (post.likedBy.length === 1) return `${post.likedBy[0]} liked this`;
  if (post.likedBy.length === 2)
    return `${post.likedBy[0]} and ${post.likedBy[1]}`;
  if (post.likedBy.length)
    return `${post.likedBy[0]}, ${post.likedBy[1]} and ${post.likeCount - 2} more`;
  return `${post.likeCount} like${post.likeCount === 1 ? "" : "s"}`;
}

/** Community feed — labeled The Office (Village-style). */
export function OfficePage() {
  const { user } = useAuth();
  const { preview } = useClientPreview();
  const [threads, setThreads] = useState<OfficeThread[]>([]);
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [likesHint, setLikesHint] = useState("");
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  async function refresh() {
    if (!user) return;
    const next = await listOfficeThreads(user.id);
    setThreads(next);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once for signed-in user
  }, [user?.id]);

  if (!user) return <Navigate to="/sign-in" replace />;
  const me = user;

  const admin = isAdminEmail(me.email) && !preview;
  const member = hasAnyProgram(me.programs) || admin;

  function patchEngagement(postId: string, eng: EngagedPost) {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.post.id === postId) {
          return { ...thread, post: { ...thread.post, ...eng } };
        }
        return {
          ...thread,
          comments: thread.comments.map((c) => {
            if (c.id === postId) return { ...c, ...eng };
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === postId ? { ...r, ...eng } : r,
              ),
            };
          }),
        };
      }),
    );
  }

  async function onLike(target: EngagedPost) {
    if (!user || !member) return;
    setError("");
    // Optimistic
    const nextLiked = !target.likedByMe;
    patchEngagement(target.id, {
      ...target,
      likedByMe: nextLiked,
      likeCount: Math.max(0, target.likeCount + (nextLiked ? 1 : -1)),
      likedBy: nextLiked
        ? [user.name.split(" ")[0] || "You", ...target.likedBy].slice(0, 8)
        : target.likedBy,
    });
    try {
      const eng = await toggleVillageLike({
        postId: target.id,
        userId: user.id,
        userName: user.name,
        currentlyLiked: target.likedByMe,
      });
      patchEngagement(target.id, { ...target, ...eng });
      setLikesHint("");
    } catch (err) {
      await refresh();
      const msg = err instanceof Error ? err.message : "Could not like";
      if (msg === LIKES_SQL_HINT) setLikesHint(msg);
      else setError(msg);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || busy) return;
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

  async function onComment(parentId: string, rootPostId: string) {
    if (!user || busy) return;
    const text = (drafts[parentId] || "").trim();
    if (!text) return;
    setError("");
    setBusy(true);
    try {
      await createVillagePost({
        authorId: user.id,
        authorName: user.name,
        body: text,
        channel: "office",
        replyTo: parentId,
      });
      setDrafts((d) => ({ ...d, [parentId]: "" }));
      setReplyingTo(null);
      setOpenComments((o) => ({ ...o, [rootPostId]: true }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not comment");
    } finally {
      setBusy(false);
    }
  }

  function onPickPhotos(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files || []).filter(
      (f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name),
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
    const label = post.replyTo ? "comment" : "post";
    if (!confirm(`Delete this ${label}?`)) return;
    setError("");
    try {
      await deleteVillagePost(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
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

  function renderEngageBar(
    target: EngagedPost,
    opts: { rootPostId: string; showComment?: boolean },
  ) {
    return (
      <div className="office-engage">
        <button
          type="button"
          className={`office-like ${target.likedByMe ? "is-liked" : ""}`}
          disabled={!member}
          aria-pressed={target.likedByMe}
          onClick={() => void onLike(target)}
        >
          <span aria-hidden="true">{target.likedByMe ? "♥" : "♡"}</span>
          {target.likeCount > 0 ? target.likeCount : "Like"}
        </button>
        {opts.showComment !== false && (
          <button
            type="button"
            className="btn btn--ghost-ink"
            disabled={!member}
            onClick={() => {
              setOpenComments((o) => ({
                ...o,
                [opts.rootPostId]: true,
              }));
              setReplyingTo(target.id);
            }}
          >
            Comment
          </button>
        )}
        {likeLabel(target) && (
          <p className="office-like__who">{likeLabel(target)}</p>
        )}
      </div>
    );
  }

  function renderCommentComposer(
    parentId: string,
    rootPostId: string,
    label: string,
    opts: { always?: boolean } = {},
  ) {
    if (!member) return null;
    const isRoot = parentId === rootPostId;
    const show =
      opts.always ||
      replyingTo === parentId ||
      (isRoot && openComments[rootPostId]);
    if (!show) return null;
    return (
      <form
        className="office-comment-form"
        onSubmit={(e) => {
          e.preventDefault();
          void onComment(parentId, rootPostId);
        }}
      >
        <label className="calc-field">
          <span>{label}</span>
          <textarea
            rows={2}
            value={drafts[parentId] || ""}
            onChange={(e) =>
              setDrafts((d) => ({ ...d, [parentId]: e.target.value }))
            }
            placeholder={
              admin
                ? "Reply as Becca — cheer her on, answer, or ask a follow-up…"
                : "Write a comment…"
            }
            maxLength={2000}
            required
          />
        </label>
        <div className="account-actions">
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Posting…" : "Post comment →"}
          </button>
          {!isRoot && replyingTo === parentId && (
            <button
              type="button"
              className="btn btn--ghost-ink"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  }

  function renderComment(comment: OfficeComment, rootPostId: string) {
    const coach = isCoachName(comment.authorName);
    return (
      <div
        key={comment.id}
        className={`office-comment ${coach ? "office-comment--coach" : ""}`}
      >
        <div className="office-post__meta">
          <strong>{comment.authorName}</strong>
          {coach && <span className="ask-reply__coach">Becca</span>}
          <time dateTime={comment.createdAt}>
            {new Date(comment.createdAt).toLocaleString()}
          </time>
        </div>
        <PostBody text={comment.body} />
        <PostMedia post={comment} />
        {renderEngageBar(comment, { rootPostId, showComment: true })}
        <div className="office-post__actions">
          {member && (
            <button
              type="button"
              className="btn btn--ghost-ink"
              onClick={() =>
                setReplyingTo((id) => (id === comment.id ? null : comment.id))
              }
            >
              Reply
            </button>
          )}
          {(admin || comment.authorId === me.id) && (
            <button
              type="button"
              className="btn btn--ghost-ink"
              onClick={() => void onDelete(comment)}
            >
              Delete
            </button>
          )}
        </div>
        {renderCommentComposer(
          comment.id,
          rootPostId,
          coach || admin ? "Reply in thread" : "Reply",
        )}
        {comment.replies.length > 0 && (
          <div className="office-comment__replies">
            {comment.replies.map((reply) => {
              const replyCoach = isCoachName(reply.authorName);
              return (
                <div
                  key={reply.id}
                  className={`office-comment office-comment--nested ${replyCoach ? "office-comment--coach" : ""}`}
                >
                  <div className="office-post__meta">
                    <strong>{reply.authorName}</strong>
                    {replyCoach && (
                      <span className="ask-reply__coach">Becca</span>
                    )}
                    <time dateTime={reply.createdAt}>
                      {new Date(reply.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <PostBody text={reply.body} />
                  <PostMedia post={reply} />
                  {renderEngageBar(reply, {
                    rootPostId,
                    showComment: false,
                  })}
                  {(admin || reply.authorId === me.id) && (
                    <div className="office-post__actions">
                      <button
                        type="button"
                        className="btn btn--ghost-ink"
                        onClick={() => void onDelete(reply)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Community</p>
      <h1>
        The <em>Office</em>
      </h1>
      <p className="portal-lede">
        Your program community — share wins, ask questions, and get unstuck with
        other founders. Like posts, leave comments, and keep the conversation
        going.
        {admin
          ? " Coach tip: like and comment on every intro — pin the gold, reply in-thread, and keep girls feeling seen."
          : ""}
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
          {(error || likesHint) && (
            <p className="form-error">{error || likesHint}</p>
          )}
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

      {!member && error && <p className="form-error">{error}</p>}

      <div className="office-feed">
        {threads.length === 0 ? (
          <div className="studio-empty">
            <h3>No posts yet</h3>
            <p>Be the first to say hey and get The Office talking.</p>
          </div>
        ) : (
          threads.map(({ post, comments, commentCount }) => {
            const commentsOpen = !!openComments[post.id] || commentCount > 0;
            return (
              <article
                key={post.id}
                className={`office-post ${post.pinned ? "office-post--pinned" : ""}`}
              >
                <div className="office-post__meta">
                  <strong>{post.authorName}</strong>
                  {isCoachName(post.authorName) && (
                    <span className="ask-reply__coach">Becca</span>
                  )}
                  {post.pinned && (
                    <span className="office-post__pin-badge">Pinned</span>
                  )}
                  <time dateTime={post.createdAt}>
                    {new Date(post.createdAt).toLocaleString()}
                  </time>
                </div>
                <PostBody text={post.body} />
                <PostMedia post={post} />
                {renderEngageBar(post, { rootPostId: post.id })}
                <div className="office-post__actions">
                  <button
                    type="button"
                    className="btn btn--ghost-ink"
                    onClick={() =>
                      setOpenComments((o) => ({
                        ...o,
                        [post.id]: !commentsOpen,
                      }))
                    }
                  >
                    {commentsOpen
                      ? `Hide comments${commentCount ? ` (${commentCount})` : ""}`
                      : `Comments${commentCount ? ` (${commentCount})` : ""}`}
                  </button>
                  {admin && (
                    <button
                      className="btn btn--ghost-ink"
                      type="button"
                      onClick={() => void onPin(post)}
                    >
                      {post.pinned ? "Unpin" : "Pin to top"}
                    </button>
                  )}
                  {(admin || post.authorId === me.id) && (
                    <button
                      className="btn btn--ghost-ink"
                      type="button"
                      onClick={() => void onDelete(post)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                {commentsOpen && (
                  <div className="office-comments">
                    {comments.map((c) => renderComment(c, post.id))}
                    {renderCommentComposer(
                      post.id,
                      post.id,
                      admin ? "Becca’s comment" : "Add a comment",
                      { always: true },
                    )}
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
