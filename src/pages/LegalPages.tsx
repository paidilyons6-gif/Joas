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
            (name, email) to run memberships, courses, and support. BodiesByBecca
            membership payments are processed by Apple or Google through the
            Bodies by Becca app. Program purchases on this website (e.g. HOTMESS)
            may be processed by Stripe — we do not store full card numbers.
          </p>
          <p>
            We use your data to deliver The Office portal and BodiesByBecca
            membership access, improve the product, and communicate about your
            account. We do not sell your personal information.
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
            Memberships renew through the Apple App Store or Google Play until
            cancelled in your device settings. Challenges may run on a seasonal
            calendar (including through October). Website programs such as
            HOTMESS are separate purchases. Content remains for active members.
            Do not share login credentials or redistribute course materials.
          </p>
          <p>
            Community posts in The Office must stay respectful. We may remove
            content that is abusive, spammy, or illegal. These terms may update
            as the product grows.
          </p>
          <p>
            <Link to="/">← Back home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
