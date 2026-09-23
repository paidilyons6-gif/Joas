import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Reveal } from "../components/Reveal";
import { useAuth } from "../lib/auth";

const HERO_IMAGE = "/hero.jpg";
const BAND_IMAGE = "/band.jpg";

export function HomePage() {
  const { user } = useAuth();

  return (
    <>
      <section
        className="hero"
        id="top"
        aria-label="Business by Becca"
        style={{ ["--hero-image" as string]: `url(${HERO_IMAGE})` }}
      >
        <div className="hero__media" aria-hidden="true" />
        <div className="hero__veil" aria-hidden="true" />
        <div className="hero__content">
          <h1>
            <Logo variant="hero" />
          </h1>
          <p className="hero__headline">Welcome to The Office.</p>
          <p className="hero__lede">
            The support system for women building companies — training,
            community, and a portal that helps you ship, not just dream.
          </p>
          <div className="hero__actions">
            <Link className="btn btn--primary" to={user ? "/portal" : "/sign-up"}>
              {user ? "Open your portal →" : "Let's do this →"}
            </Link>
            <Link className="btn btn--ghost" to="/pricing">
              Membership
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
            <p className="manifesto__accent">Your seat at The Office ♡</p>
            <p className="section__copy">
              Practical tools. Real conversations. Big results. This is where
              you get help with offers, launches, and growth — so you don&apos;t
              have to figure it out alone.
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
              The Office — education, community, resources, and freedom in one
              place.
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

      <section
        className="band"
        aria-labelledby="band-title"
        style={{ ["--band-image" as string]: `url(${BAND_IMAGE})` }}
      >
        <div className="band__media" aria-hidden="true" />
        <div className="band__veil" aria-hidden="true" />
        <Reveal className="band__content">
          <h2 id="band-title">
            Bigger plans start in <em>The Office.</em>
          </h2>
          <p>
            Create your account, open The Office with BodiesByBecca membership
            (App Store / Play), and keep selling programs like HOTMESS on the
            site.
          </p>
        </Reveal>
      </section>

      <section className="section offer" aria-labelledby="offer-title">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">Inside The Office</p>
            <h2 className="section__title" id="offer-title">
              Progress over <em>perfection.</em>
            </h2>
            <p className="section__copy">
              Elite courses, financial calculators, and startup worksheets —
              everything you need to build and get paid.
            </p>
          </Reveal>
          <div className="offer__rows">
            <Reveal className="offer__row" as="div">
              <h3>3 course tracks</h3>
              <p>
                Startup Foundations, Money &amp; Margins, and Launch &amp; Sales
                — with lesson players, objectives, and checkoffs.
              </p>
            </Reveal>
            <Reveal className="offer__row" as="div">
              <h3>Financial calculators</h3>
              <p>
                Pricing, break-even, revenue goals, runway, profit, and offer
                stack math — built for founders, not finance majors.
              </p>
            </Reveal>
            <Reveal className="offer__row" as="div">
              <h3>Startup toolkit</h3>
              <p>
                Offer builder, ideal client sketch, 7-day launch planner, and
                weekly CEO scorecard — saved as you go.
              </p>
            </Reveal>
          </div>
          <div className="section__cta-row">
            <Link className="btn btn--primary" to="/programs">
              Shop programs →
            </Link>
            <Link className="btn btn--ink" to="/pricing">
              BodiesByBecca membership
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
