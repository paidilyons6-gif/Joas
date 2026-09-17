import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Reveal } from "../components/Reveal";
import { useAuth } from "../lib/auth";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1529333166432-c89d40d0d94c?auto=format&fit=crop&w=2400&q=80";
const BAND_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80";

export function HomePage() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero" id="top" aria-label="Business by Becca">
        <div className="hero__media" aria-hidden="true">
          <img
            src={HERO_IMAGE}
            alt=""
            width={2400}
            height={1600}
            fetchPriority="high"
          />
        </div>
        <div className="hero__veil" aria-hidden="true" />
        <div className="hero__content">
          <h1>
            <Logo variant="hero" />
          </h1>
          <p className="hero__headline">Like the village, but for business.</p>
          <p className="hero__lede">
            The support system for women building companies — training,
            community, and a portal that helps you ship, not just dream.
          </p>
          <div className="hero__actions">
            <Link className="btn btn--primary" to={user ? "/portal" : "/sign-up"}>
              {user ? "Open your portal →" : "Let's do this →"}
            </Link>
            <Link className="btn btn--ghost" to="/pricing">
              See membership
            </Link>
          </div>
        </div>
      </section>

      <section className="section manifesto" aria-labelledby="manifesto-title">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">Becky Lyons</p>
            <h2 className="manifesto__title" id="manifesto-title">
              Build the damn business.
            </h2>
            <p className="manifesto__accent">Like the village, but for business ♡</p>
            <p className="section__copy">
              Practical tools. Real conversations. Big results. Business by
              Becca is your village for offers, launches, and growth — so you
              don&apos;t have to figure it out alone.
            </p>
            <ul className="checklist">
              <li>Bigger income</li>
              <li>A life I love</li>
              <li>Helping others</li>
              <li>Proud of me</li>
              <li>Freedom</li>
              <li>Same girl, bigger plans ♡</li>
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="section pillars" id="pillars" aria-labelledby="pillars-title">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">The mix</p>
            <h2 className="section__title" id="pillars-title">
              Ambitious. Unfiltered. <em>Yours.</em>
            </h2>
            <p className="section__copy">
              Sign up free, subscribe when you&apos;re ready, and train inside
              your private portal — your business village for education,
              community, resources, and freedom.
            </p>
          </Reveal>

          <div className="pillars__grid">
            {[
              ["Education", "Strategy that actually ships", "Clear frameworks for offers, pricing, sales, and systems — built for real life."],
              ["Community", "Your ambitious girl gang", "Accountability and honest feedback from women who get the dream and the dinner rush."],
              ["Resources", "Tools you can use tonight", "Templates, scripts, and playbooks that cut overwhelm so you move today."],
              ["Freedom", "A life that looks good on you", "Income and impact on your terms — more space, more choice, more you."],
            ].map(([name, title, copy]) => (
              <Reveal className="pillar" as="div" key={name}>
                <p className="pillar__name">{name}</p>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="band-title">
        <div className="band__media" aria-hidden="true">
          <img src={BAND_IMAGE} alt="" width={2000} height={1333} loading="lazy" />
        </div>
        <div className="band__veil" aria-hidden="true" />
        <Reveal className="band__content">
          <h2 id="band-title">
            Your village for <em>bigger</em> plans.
          </h2>
          <p>
            Create your account, join membership, and open a portal built for
            progress over perfection — with people who get it.
          </p>
        </Reveal>
      </section>

      <section className="section offer" aria-labelledby="offer-title">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">Inside the portal</p>
            <h2 className="section__title" id="offer-title">
              Progress over <em>perfection.</em>
            </h2>
            <p className="section__copy">
              A home base for training modules, lesson checkoffs, resource
              downloads, and billing — all in one pink-powered place.
            </p>
          </Reveal>
          <div className="offer__rows">
            <Reveal className="offer__row" as="div">
              <h3>Guided curriculum</h3>
              <p>
                Four phases from clarity to growth — complete lessons, track
                wins, and keep momentum between busy weeks.
              </p>
            </Reveal>
            <Reveal className="offer__row" as="div">
              <h3>Membership that pays for itself</h3>
              <p>
                Monthly or founding-year plans unlock the full vault. Manage
                billing anytime from your account.
              </p>
            </Reveal>
            <Reveal className="offer__row" as="div">
              <h3>Built to grow with you</h3>
              <p>
                Start free, upgrade when ready. Demo mode works today; wire
                Supabase + Stripe when you go live.
              </p>
            </Reveal>
          </div>
          <div className="section__cta-row">
            <Link className="btn btn--primary" to="/pricing">
              View pricing →
            </Link>
            <Link className="btn btn--ink" to="/sign-up">
              Create free account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
