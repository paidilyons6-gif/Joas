import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { RESOURCES } from "../../data/resources";
import { useAuth } from "../../lib/auth";
import { isMember } from "../../lib/access";

export function ResourcesPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;
  const member = isMember(user.plan);
  const [copied, setCopied] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  async function copyContent(id: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Resource vault</p>
      <h1>
        Templates you can use <em>tonight</em>
      </h1>
      <p className="portal-lede">
        Scripts, checklists, and canvases — copy straight into your notes.
      </p>

      {!member && (
        <div className="upgrade-banner">
          <div>
            <h2>Most vault items unlock with membership</h2>
            <p>Free preview includes CEO weekly habits.</p>
          </div>
          <Link className="btn btn--primary" to="/pricing">
            Upgrade →
          </Link>
        </div>
      )}

      <div className="vault-list">
        {RESOURCES.map((resource) => {
          const locked = resource.membersOnly && !member;
          const open = openId === resource.id;
          return (
            <article
              key={resource.id}
              className={`vault-card ${locked ? "module-card--locked" : ""}`}
            >
              <div className="vault-card__top">
                <div>
                  <p className="module-card__phase">{resource.type}</p>
                  <h3>{resource.title}</h3>
                  <p>{resource.blurb}</p>
                </div>
                {locked ? (
                  <Link className="btn btn--primary" to="/pricing">
                    Unlock →
                  </Link>
                ) : (
                  <div className="account-actions">
                    <button
                      className="btn btn--ghost-ink"
                      type="button"
                      onClick={() =>
                        setOpenId(open ? null : resource.id)
                      }
                    >
                      {open ? "Hide" : "View"}
                    </button>
                    <button
                      className="btn btn--ink"
                      type="button"
                      onClick={() =>
                        void copyContent(resource.id, resource.content)
                      }
                    >
                      {copied === resource.id ? "Copied ♡" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
              {!locked && open && (
                <pre className="vault-content">{resource.content}</pre>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
