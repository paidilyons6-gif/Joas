import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1529333166432-c89d40d0d94c?auto=format&fit=crop&w=2400&q=80";
const BAND_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80";

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.classList.add("is-visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function Reveal({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "ul" | "li";
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag ref={ref as never} className={`reveal ${className}`.trim()}>
      {children}
    </Tag>
  );
}

function Logo({
  variant = "default",
}: {
  variant?: "default" | "light" | "hero";
}) {
  const className =
    variant === "hero"
      ? "logo logo--hero"
      : variant === "light"
        ? "logo logo--light"
        : "logo";

  return (
    <span className={className}>
      <span className="logo__business">Business</span>
      <span className="logo__by">
        by Becca <span aria-hidden="true">♡</span>
      </span>
    </span>
  );
}

export default function App() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setJoined(true);
  }

  return (
    <div className="site">
      <header className="nav">
        <a href="#top" aria-label="Business by Becca home">
          <Logo variant="light" />
        </a>
        <a className="nav__cta" href="#join">
          Let&apos;s do this →
        </a>
      </header>

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
          <p className="hero__headline">Build the damn business.</p>
          <p className="hero__lede">
            Big dreams. Real strategy. A brighter you — practical tools for
            women who want more without losing themselves.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#join">
              Let&apos;s do this →
            </a>
            <a className="btn btn--ghost" href="#pillars">
              See the vibe
            </a>
          </div>
        </div>
      </section>

      <section className="section manifesto" aria-labelledby="manifesto-title">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">Same girl, bigger plans</p>
            <h2 className="manifesto__title" id="manifesto-title">
              You&apos;ve got this.
            </h2>
            <p className="manifesto__accent">Action over perfection ♡</p>
            <p className="section__copy">
              Practical tools. Real conversations. Big results. Business by
              Becca is for the girls who want more — more freedom, more income,
              more impact — without losing their personality in the process.
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

      <section
        className="section pillars"
        id="pillars"
        aria-labelledby="pillars-title"
      >
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">The mix</p>
            <h2 className="section__title" id="pillars-title">
              Ambitious. Unfiltered. <em>Yours.</em>
            </h2>
            <p className="section__copy">
              Education, community, resources, and freedom — built for founders
              who move fast and stay real.
            </p>
          </Reveal>

          <div className="pillars__grid">
            <Reveal className="pillar" as="div">
              <p className="pillar__name">Education</p>
              <div>
                <h3>Strategy that actually ships</h3>
                <p>
                  Clear frameworks for offers, pricing, sales, and systems —
                  designed for women building between real life and big goals.
                </p>
              </div>
            </Reveal>
            <Reveal className="pillar" as="div">
              <p className="pillar__name">Community</p>
              <div>
                <h3>Your ambitious girl gang</h3>
                <p>
                  Accountability, celebrations, and honest feedback from women
                  who get the dream and the dinner rush.
                </p>
              </div>
            </Reveal>
            <Reveal className="pillar" as="div">
              <p className="pillar__name">Resources</p>
              <div>
                <h3>Tools you can use tonight</h3>
                <p>
                  Templates, scripts, and playbooks that cut the overwhelm so
                  you can take the next right step — today.
                </p>
              </div>
            </Reveal>
            <Reveal className="pillar" as="div">
              <p className="pillar__name">Freedom</p>
              <div>
                <h3>A life that looks good on you</h3>
                <p>
                  Income and impact on your terms — more space, more choice, and
                  a business that funds the life you love.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="band-title">
        <div className="band__media" aria-hidden="true">
          <img
            src={BAND_IMAGE}
            alt=""
            width={2000}
            height={1333}
            loading="lazy"
          />
        </div>
        <div className="band__veil" aria-hidden="true" />
        <Reveal className="band__content">
          <h2 id="band-title">
            Freedom looks <em>good</em> on you.
          </h2>
          <p>
            Ambition isn&apos;t the opposite of softness. Build boldly, stay
            you, and make the damn plan happen.
          </p>
        </Reveal>
      </section>

      <section className="section offer" aria-labelledby="offer-title">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">Inside</p>
            <h2 className="section__title" id="offer-title">
              Progress over <em>perfection.</em>
            </h2>
            <p className="section__copy">
              Whether you&apos;re sketching the idea or scaling what&apos;s
              already working, this is where strategy meets personality.
            </p>
          </Reveal>

          <div className="offer__rows">
            <Reveal className="offer__row" as="div">
              <h3>Guided curriculum</h3>
              <p>
                Offer design, branding, sales, and ops — taught in a way that
                respects your time and keeps your voice loud.
              </p>
            </Reveal>
            <Reveal className="offer__row" as="div">
              <h3>Live coaching &amp; office hours</h3>
              <p>
                Ask the messy questions, get unstuck fast, and leave with a next
                move you can finish this week.
              </p>
            </Reveal>
            <Reveal className="offer__row" as="div">
              <h3>A brighter-you community</h3>
              <p>
                Celebrate wins, swap referrals, and build alongside women who
                choose action over perfection — every time.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section cta" id="join" aria-labelledby="cta-title">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">Early access</p>
            <h2 className="section__title" id="cta-title">
              Ready when <em>you</em> are.
            </h2>
            <p className="section__copy">
              Jump on the waitlist for Business by Becca. Founding access,
              first workshops, and launch news — no fluff.
            </p>

            {joined ? (
              <p className="cta__success" role="status">
                You&apos;re in. Big dreams incoming ♡
              </p>
            ) : (
              <>
                <form className="cta__form" onSubmit={onSubmit}>
                  <label className="visually-hidden" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <button className="btn btn--ink" type="submit">
                    Let&apos;s do this →
                  </button>
                </form>
                <p className="cta__note">No spam. Just brighter-future updates.</p>
              </>
            )}
          </Reveal>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__top">
            <div>
              <Logo variant="light" />
              <p className="footer__tag">
                Big dreams. Real strategy. A brighter you.
              </p>
            </div>
            <nav className="footer__nav" aria-label="Footer">
              <a href="#pillars">Education</a>
              <a href="#pillars">Community</a>
              <a href="#pillars">Resources</a>
              <a href="#join">Freedom</a>
            </nav>
          </div>
          <p className="footer__meta">
            From the world of Bodies by Becca · Built for girls with bigger
            plans ♡
          </p>
        </div>
      </footer>
    </div>
  );
}
