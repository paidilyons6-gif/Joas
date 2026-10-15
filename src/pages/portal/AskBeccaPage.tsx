import { type FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { VideoPlayer } from "../../components/VideoPlayer";
import { useAuth } from "../../lib/auth";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import {
  ASK_SQL_HINT,
  createVillagePost,
  deleteVillagePost,
  listAskThreads,
  setVillagePostPinned,
  type AskThread,
  type VillagePost,
} from "../../lib/villageRepo";
import { hasAnyProgram } from "../../lib/access";

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

/** Dedicated left-nav Q&A — members ask, Becca (and members) can reply. */
export function AskBeccaPage() {
  const { user } = useAuth();
  const { preview } = useClientPreview();
  const [threads, setThreads] = useState<AskThread[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [needsSql, setNeedsSql] = useState(false);

  async function refresh() {
    try {
      setThreads(await listAskThreads());
      setNeedsSql(false);
      setError("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not load questions";
      if (msg === ASK_SQL_HINT) {
        setNeedsSql(true);
        setThreads([]);
      } else {
        setError(msg);
      }
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  if (!user) return <Navigate to="/sign-in" replace />;

  const admin = isAdminEmail(user.email) && !preview;
  const member = hasAnyProgram(user.programs) || admin;

  async function onAsk(event: FormEvent) {
    event.preventDefault();
    if (!user || busy) return;
    const sent = body;
    setError("");
    setBusy(true);
    try {
      await createVillagePost({
        authorId: user.id,
        authorName: user.name,
        body: sent,
        channel: "ask",
      });
      setBody((current) => (current === sent ? "" : current));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post question");
    } finally {
      setBusy(false);
    }
  }

  async function onReply(event: FormEvent, questionId: string) {
    event.preventDefault();
    if (!user || busy) return;
    const sent = replyBody;
    setError("");
    setBusy(true);
    try {
      await createVillagePost({
        authorId: user.id,
        authorName: user.name,
        body: sent,
        channel: "ask",
        replyTo: questionId,
      });
      setReplyBody("");
      setReplyingTo(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reply");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(post: VillagePost) {
    if (!confirm(post.replyTo ? "Delete this reply?" : "Delete this question and its replies?"))
      return;
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
      setError(err instanceof Error ? err.message : "Could not pin");
    }
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Community</p>
      <h1>
        Ask <em>Becca</em>
      </h1>
      <p className="portal-lede">
        Questions for Becca — drop your sticky problems here. She&apos;ll answer
        in the thread. Keep The Office for chats with the group.
        {admin ? " Coach tip: pin the most useful questions to the top." : ""}
      </p>

      {!member && (
        <div className="upgrade-banner">
          <div>
            <h2>Buy a program to ask Becca</h2>
            <p>Program members can post questions and see her answers here.</p>
          </div>
          <Link className="btn btn--primary" to="/programs">
            Shop programs →
          </Link>
        </div>
      )}

      {needsSql && admin && (
        <p className="form-error">{ASK_SQL_HINT}</p>
      )}
      {needsSql && !admin && (
        <p className="form-error">
          Ask Becca is almost ready — Becca just needs to finish a quick setup.
        </p>
      )}

      {member && !needsSql && (
        <form className="office-composer" onSubmit={(e) => void onAsk(e)}>
          <label className="calc-field">
            <span>Your question for Becca</span>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What’s stuck? Be as specific as you can…"
              maxLength={2000}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="account-actions">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? "Posting…" : "Ask Becca →"}
            </button>
          </div>
        </form>
      )}

      {error && !member && <p className="form-error">{error}</p>}

      <div className="office-feed ask-feed">
        {threads.length === 0 && !needsSql ? (
          <div className="studio-empty">
            <h3>No questions yet</h3>
            <p>Be the first to ask — Becca&apos;s watching this board.</p>
          </div>
        ) : (
          threads.map(({ question, replies }) => (
            <article
              key={question.id}
              className={`office-post ask-thread ${question.pinned ? "office-post--pinned" : ""}`}
            >
              <div className="office-post__meta">
                <strong>{question.authorName}</strong>
                {question.pinned && (
                  <span className="office-post__pin-badge">Pinned</span>
                )}
                <time dateTime={question.createdAt}>
                  {new Date(question.createdAt).toLocaleString()}
                </time>
              </div>
              {question.body && <p>{question.body}</p>}
              <PostMedia post={question} />

              <div className="office-post__actions">
                {member && (
                  <button
                    className="btn btn--ghost-ink"
                    type="button"
                    onClick={() => {
                      setReplyingTo(
                        replyingTo === question.id ? null : question.id,
                      );
                      setReplyBody("");
                    }}
                  >
                    {replyingTo === question.id ? "Cancel" : "Reply"}
                  </button>
                )}
                {admin && (
                  <button
                    className="btn btn--ghost-ink"
                    type="button"
                    onClick={() => void onPin(question)}
                  >
                    {question.pinned ? "Unpin" : "Pin to top"}
                  </button>
                )}
                {(admin || question.authorId === user.id) && (
                  <button
                    className="btn btn--ghost-ink"
                    type="button"
                    onClick={() => void onDelete(question)}
                  >
                    Delete
                  </button>
                )}
              </div>

              {replies.length > 0 && (
                <div className="ask-replies">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`ask-reply ${/becca/i.test(reply.authorName) ? "ask-reply--coach" : ""}`}
                    >
                      <div className="office-post__meta">
                        <strong>{reply.authorName}</strong>
                        {/becca/i.test(reply.authorName) && (
                          <span className="ask-reply__coach">Becca</span>
                        )}
                        <time dateTime={reply.createdAt}>
                          {new Date(reply.createdAt).toLocaleString()}
                        </time>
                      </div>
                      {reply.body && <p>{reply.body}</p>}
                      <PostMedia post={reply} />
                      {(admin || reply.authorId === user.id) && (
                        <div className="office-post__actions">
                          <button
                            className="btn btn--ghost-ink"
                            type="button"
                            onClick={() => void onDelete(reply)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === question.id && (
                <form
                  className="ask-reply-form"
                  onSubmit={(e) => void onReply(e, question.id)}
                >
                  <label className="calc-field">
                    <span>{admin ? "Becca’s answer" : "Your reply"}</span>
                    <textarea
                      rows={2}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder={
                        admin
                          ? "Answer her question…"
                          : "Add a follow-up…"
                      }
                      maxLength={2000}
                      required
                    />
                  </label>
                  <button className="btn btn--primary" type="submit" disabled={busy}>
                    {busy ? "Sending…" : "Post reply →"}
                  </button>
                </form>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
