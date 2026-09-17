import { useEffect, useRef, useState, type FormEvent } from "react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1484863137850-59afcfe05386?auto=format&fit=crop&w=2400&q=80";
const BAND_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=80";

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
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
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
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "ul" | "li";
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag ref={ref as never} className={`reveal ${className}`.trim()}>
      {children}
    </Tag>
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
        <a className="nav__mark" href="#top">
          Becca Businesses
        </a>
        <a className="nav__link" href="#join">
          Join the waitlist
        </a>
      </header>

      <section className="hero" id="top" aria-label="Becca Businesses">
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
          <h1 className="hero__brand">Becca Businesses</h1>
          <p className="hero__headline">
            The launchpad for mothers building companies of their own.
          </p>
          <p className="hero__lede">
            Clear guidance, real community, and a path that fits around the life
            you already love.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#join">
              Get on the list
            </a>
            <a className="btn btn--ghost" href="#path">
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section className="section promise" aria-labelledby="promise-title">
        <div className="section__inner">
          <Reveal>
            <p className="section__label">Built for moms</p>
            <h2 className="section__title" id="promise-title">
              Your idea deserves a real runway.
            </h2>
            <p className="section__copy">
              Becca Businesses helps mothers turn what they know, love, and live
              into businesses that last — without pretending you have unlimited
              hours or a spare cofounder.
            </p>
          </Reveal>

          <div className="promise__grid">
            <Reveal className="promise__item" as="div">
              <p className="promise__num">01</p>
              <h3>Clarity first</h3>
              <p>
                Name the offer, the customer, and the next right move — so you
                stop spinning and start shipping.
              </p>
            </Reveal>
            <Reveal className="promise__item" as="div">
              <p className="promise__num">02</p>
              <h3>Launch with support</h3>
              <p>
                Step-by-step launch plans, honest feedback, and a circle of moms
                who get the juggle.
              </p>
            </Reveal>
            <Reveal className="promise__item" as="div">
              <p className="promise__num">03</p>
              <h3>Grow on purpose</h3>
              <p>
                Systems, pricing, and momentum that scale with your season of
                life — not against it.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section
        className="section path"
        id="path"
        aria-labelledby="path-title"
      >
        <div className="section__inner">
          <Reveal>
            <p className="section__label">The path</p>
            <h2 className="section__title" id="path-title">
              From kitchen-table idea to open for business.
            </h2>
            <p className="section__copy">
              A simple arc designed for real weeks with kids, careers, and
              everything in between.
            </p>
          </Reveal>

          <div className="path__steps">
            <Reveal className="path__step" as="div">
              <p className="path__phase">Phase one</p>
              <div>
                <h3>Find your edge</h3>
                <p>
                  Workshops and one-to-one coaching help you shape a business
                  rooted in your skills, story, and the market that actually
                  needs you.
                </p>
              </div>
            </Reveal>
            <Reveal className="path__step" as="div">
              <p className="path__phase">Phase two</p>
              <div>
                <h3>Build the foundation</h3>
                <p>
                  Brand basics, offer design, pricing, and a lightweight
                  operations setup so launch day feels steady — not scrambled.
                </p>
              </div>
            </Reveal>
            <Reveal className="path__step" as="div">
              <p className="path__phase">Phase three</p>
              <div>
                <h3>Go live &amp; grow</h3>
                <p>
                  First customers, first sales, and the habits that keep revenue
                  moving while you protect family time.
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
          <h2 id="band-title">Motherhood is not a detour from ambition.</h2>
          <p>
            It is the reason so many of us build differently — with more heart,
            sharper priorities, and businesses that actually fit our lives.
          </p>
        </Reveal>
      </section>

      <section className="section offer" aria-labelledby="offer-title">
        <div className="section__inner">
          <Reveal>
            <p className="section__label">What you get</p>
            <h2 className="section__title" id="offer-title">
              Support that meets you where you are.
            </h2>
            <p className="section__copy">
              Whether you are sketching a first idea or refining something
              already in motion, Becca Businesses walks with you.
            </p>
          </Reveal>

          <div className="offer__list">
            <Reveal className="offer__row" as="div">
              <h3>Guided curriculum</h3>
              <p>
                Practical modules on offers, branding, sales, and systems —
                written for founders who nap-time plan and after-bedtime
                execute.
              </p>
            </Reveal>
            <Reveal className="offer__row" as="div">
              <h3>Live coaching &amp; office hours</h3>
              <p>
                Ask the hard questions, get unstuck fast, and leave with a next
                step you can finish this week.
              </p>
            </Reveal>
            <Reveal className="offer__row" as="div">
              <h3>A community of mom founders</h3>
              <p>
                Celebrate wins, share referrals, and build alongside women who
                understand both the dream and the dinner rush.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section cta" id="join" aria-labelledby="cta-title">
        <div className="section__inner">
          <Reveal>
            <p className="section__label">Early access</p>
            <h2 className="section__title" id="cta-title">
              Ready when you are, mama.
            </h2>
            <p className="section__copy">
              Join the waitlist for Becca Businesses. We will share launch
              details, founding-member access, and the first workshops as they
              open.
            </p>

            {joined ? (
              <p className="cta__success" role="status">
                You&apos;re on the list — we&apos;ll be in touch soon.
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
                    Join the waitlist
                  </button>
                </form>
                <p className="cta__note">No spam. Just launch news that matters.</p>
              </>
            )}
          </Reveal>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__inner">
          <p className="footer__brand">Becca Businesses</p>
          <p className="footer__meta">
            From the team behind Bodies by Becca · Helping mothers build
            companies with confidence
          </p>
        </div>
      </footer>

      <style>{`
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}
