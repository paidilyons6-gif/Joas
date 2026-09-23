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
            (name, email) to run memberships, courses, and support. Payment
            details are processed by Stripe — we do not store full card numbers.
          </p>
          <p>
            We use your data to deliver the Learning Village portal, improve the
            product, and communicate about your membership. We do not sell your
            personal information.
          </p>
          <p>
            You can request access or deletion of your account data by emailing
            the site admin. Demo-mode data stays on your device in local storage.
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
            Memberships renew according to the plan you choose until cancelled.
            Content remains for active members. Do not share login credentials or
            redistribute course materials.
          </p>
          <p>
            Village posts must stay respectful. We may remove content that is
            abusive, spammy, or illegal. These terms may update as the product
            grows.
          </p>
          <p>
            <Link to="/">← Back home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
