import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <main className="page legal-page">
      <div className="section__inner">
        <p className="eyebrow">Legal</p>
        <h1 className="section__title">
          Privacy <em>policy</em>
        </h1>
        <div className="legal-copy">
          <p>
            Business by Becca collects the account information you provide
            (name, email) to run programs, courses, and support. Program
            purchases on this website may be processed by Stripe — we do not
            store full card numbers.
          </p>
          <p>
            We use your data to deliver The Office portal, improve the product,
            and communicate about your account. We do not sell your personal
            information.
          </p>
          <p>
            You can request access or deletion of your account data by emailing
            the site admin. Local demo data stays on your device in browser
            storage.
          </p>
          <p>
            <Link to="/">← Back home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export function TermsPage() {
  return (
    <main className="page legal-page">
      <div className="section__inner">
        <p className="eyebrow">Legal</p>
        <h1 className="section__title">
          Terms of <em>use</em>
        </h1>
        <div className="legal-copy">
          <p>
            Business by Becca provides educational content, tools, and community
            features for informational purposes. Results depend on your effort,
            offer, and market — we do not guarantee income outcomes.
          </p>
          <p>
            Website programs are sold separately (one-time or subscription).
            Content remains available for active purchasers. Do not share login
            credentials or redistribute course materials.
          </p>
          <p>
            Community posts in The Office must stay respectful. We may remove
            content that is abusive, spammy, or illegal. These terms may update
            over time; continued use means you accept the current version.
          </p>
          <p>
            <Link to="/">← Back home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
