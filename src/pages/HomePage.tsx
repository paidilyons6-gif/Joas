import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Logo } from "../components/Logo";
import { Reveal } from "../components/Reveal";
import { useAuth } from "../lib/auth";
import { DEFAULT_SITE_COPY, type SiteCopy } from "../lib/siteCopy";
import { fetchSiteCopy } from "../lib/coursesRepo";

const HERO_IMAGE = "/hero.jpg";
const BAND_IMAGE = "/band.jpg";

export function HomePage() {
  const { user } = useAuth();
  const [copy, setCopy] = useState<SiteCopy>(DEFAULT_SITE_COPY);

  useEffect(() => {
    void fetchSiteCopy().then(setCopy);
    const refresh = () => {
      void fetchSiteCopy().then(setCopy);
    };
    window.addEventListener("bbb-copy-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("bbb-copy-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

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
          <p className="hero__headline">{copy.heroHeadline}</p>
          <p className="hero__lede">{copy.heroLede}</p>
          <div className="hero__actions">
            <Link className="btn btn--primary" to={user ? "/portal" : "/sign-up"}>
              {user ? copy.heroCtaMember : copy.heroCtaGuest}
            </Link>
            <Link className="btn btn--ghost" to="/pricing">
              {copy.heroCtaSecondary}
            </Link>
          </div>
        </div>
      </section>

      <section className="section manifesto" aria-labelledby="manifesto-title">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">{copy.manifestoEyebrow}</p>
            <h2 className="manifesto__title" id="manifesto-title">
              {copy.manifestoTitle}
            </h2>
            <p className="manifesto__accent">{copy.manifestoAccent}</p>
            <p className="section__copy">{copy.manifestoCopy}</p>
            <ul className="checklist">
              {copy.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="section pillars" id="pillars" aria-labelledby="pillars-title">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">{copy.pillarsEyebrow}</p>
            <h2 className="section__title" id="pillars-title">
              {copy.pillarsTitle} <em>{copy.pillarsTitleEm}</em>
            </h2>
            <p className="section__copy">{copy.pillarsCopy}</p>
          </Reveal>

          <div className="pillars__grid">
            {[
              ["Education", "Strategy that actually ships", "Clear frameworks for offers, pricing, sales, and systems — built for real life."],
              ["Community", "Your ambitious girl gang", "Accountability and honest feedback from women who get the dream and the dinner rush."],
              ["Resources", "Tools you can use tonight", "Templates, scripts, and playbooks that cut overwhelm so you move today."],
              ["Freedom", "A life that looks good on you", "Income and impact on your terms — more space, more choice, more you."],
            ].map(([name, title, blurb]) => (
              <Reveal className="pillar" as="div" key={name}>
                <p className="pillar__name">{name}</p>
                <div>
                  <h3>{title}</h3>
                  <p>{blurb}</p>
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
            {copy.bandTitle} <em>{copy.bandTitleEm}</em>
          </h2>
          <p>{copy.bandCopy}</p>
        </Reveal>
      </section>

      <section className="section offer" aria-labelledby="offer-title">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">{copy.offerEyebrow}</p>
            <h2 className="section__title" id="offer-title">
              {copy.offerTitle} <em>{copy.offerTitleEm}</em>
            </h2>
            <p className="section__copy">{copy.offerCopy}</p>
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
