import { useRef } from "react";
import { Link } from "../i18n/Link";
import { useSite } from "../content/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { useEntrances } from "../hooks/useEntrances";
import { useHeroReveal } from "../hooks/useHeroReveal";
import { Arrow } from "../components/Arrow";
import { Frame } from "../components/Frame";
import { Lines, Paragraphs, SpanLines } from "../components/Rich";
import { BtnLink, CtaBand, Sections, TextLink, pad2 } from "../components/Blocks";
import { ProjectSlider } from "../components/ProjectSlider";

/**
 * Homepage: the hero, then a short preview of each main part of the site
 * (À propos, Services, Projets, Formations, Contact), each leading to its page.
 * Order and visibility of the previews are set in the dashboard (Accueil ›
 * Sections de la page); the Formations preview is hidden by default.
 */
export function Home() {
  const { content, projects } = useSite();
  const { hero, about, seo } = content.home;
  const sv = content.home.services;
  const pj = content.home.projects;
  const ct = content.home.contact;
  const fm = content.home.formations;
  const up = content.formations.upcoming;
  const heroRef = useRef<HTMLElement>(null);

  useSeo(seo.title, seo.description);
  useHeroReveal(heroRef, hero.image.src);
  useEntrances([content.home.layout]);

  const serviceCount = Math.max(1, Math.min(content.services.list.items.length, Number.parseInt(sv.count, 10) || 3));
  const interval = Math.max(3, Math.min(15, Number.parseFloat(pj.interval.replace(",", ".")) || 6));
  const { whatsapp } = content.site.contact;

  const heroSizes = "(max-width: 980px) 100vw, 52vw";
  return (
    <main id="contenu">
      <section className="hero hero--portrait" data-reveal aria-labelledby="hero-title" ref={heroRef}>
        <div className="hero__media" aria-hidden="true">
          <img
            className="hero__ambient"
            src={hero.image.src}
            srcSet={hero.image.srcSet}
            sizes={hero.image.srcSet ? heroSizes : undefined}
            width={hero.image.width}
            height={hero.image.height}
            alt=""
            fetchPriority="high"
            decoding="async"
          />
          <div className="hero__reveal">
            <img
              src={hero.image.src}
              srcSet={hero.image.srcSet}
              sizes={hero.image.srcSet ? heroSizes : undefined}
              width={hero.image.width}
              height={hero.image.height}
              alt=""
              decoding="async"
            />
          </div>
          <div className="hero__scrim"></div>
        </div>
        <div className="hero__content">
          <div className="wrap grid">
            <p className="label hero__label">{hero.label}</p>
            <h1 className="hero__title" id="hero-title">
              <SpanLines text={hero.title} />
            </h1>
            <div className="hero__aside">
              <p>{hero.text}</p>
              <div className="btn-row">
                <Link className="btn" to="/projets">
                  {hero.primaryCta} <Arrow />
                </Link>
                <TextLink to="/contact">{hero.secondaryCta}</TextLink>
              </div>
            </div>
            <div className="hero__foot">
              <Link className="hero__cue" to="/#a-propos">
                <i aria-hidden="true"></i>
                {hero.cue}
              </Link>
              <span className="hero__hint" aria-hidden="true">
                {hero.hint}
              </span>
              <span className="hero__coords">{hero.place}</span>
            </div>
          </div>
        </div>
      </section>

      <Sections
        layout={content.home.layout.sections}
        blocks={{
          about: () => (
      <section className="section about" id="a-propos" aria-labelledby="about-title">
        <div className="wrap grid">
          <p className="label" style={{ gridColumn: "1/-1", gridRow: 1 }}>
            {about.label}
          </p>
          <h2 className="display" id="about-title" data-in>
            <Lines text={about.title} />
          </h2>
          <div className="about__portrait" data-in>
            <Frame image={about.portrait} ratio="frame--tall" sizes="(max-width: 980px) 90vw, 40vw" />
          </div>
          <div className="about__text" data-in>
            <p className="lead">{about.lead}</p>
            <div className="prose">
              <Paragraphs text={about.text} />
            </div>
            <div className="btn-row">
              <BtnLink to="/a-propos" ghost>
                {about.link}
              </BtnLink>
            </div>
          </div>
          {about.detailImage && (
            <figure className="about__detail" data-in style={{ margin: 0 }}>
              <Frame image={about.detailImage} ratio="frame--port" />
              {about.caption && <figcaption className="meta about__caption">{about.caption}</figcaption>}
            </figure>
          )}
        </div>
      </section>
          ),
          services: () => (
      <section className="section" id="services" aria-labelledby="svc-title">
        <div className="wrap grid">
          <div className="grid s-head" style={{ gridColumn: "1/-1" }}>
            <p className="label">{sv.label}</p>
            <h2 className="display" id="svc-title" data-in>
              <Lines text={sv.title} />
            </h2>
          </div>
          <div className="services">
            {content.services.list.items.slice(0, serviceCount).map((it, i) => (
              <div className="svc" data-in key={i}>
                <span className="svc__no num">{pad2(i + 1)}</span>
                <h3 className="svc__title">{it.title}</h3>
                <p className="svc__desc">{it.description}</p>
              </div>
            ))}
          </div>
          <div className="services__cta">
            <p>{sv.text}</p>
            <BtnLink to="/services">{sv.button}</BtnLink>
          </div>
        </div>
      </section>
          ),
          projects: () => (
      <section className="section on-paper work--slider" id="projets" aria-labelledby="work-title">
        <div className="wrap">
          <div className="grid s-head">
            <p className="label">{pj.label}</p>
            <h2 className="display" id="work-title" data-in>
              <Lines text={pj.title} />
            </h2>
            <p className="s-head__aside" data-in>
              {pj.text}
            </p>
          </div>
          <div data-in>
            {projects.length > 0 && <ProjectSlider projects={projects} interval={interval} labels={pj} />}
          </div>
          <div className="pslider__end">
            <BtnLink to="/projets" ghost>
              {pj.button}
            </BtnLink>
          </div>
        </div>
      </section>
          ),
          formations: () => (
            <section className="section on-paper teach" id="formations" aria-labelledby="teach-title">
              <div className="wrap grid">
                <p className="label" style={{ gridColumn: "1/-1" }}>
                  {fm.label}
                </p>
                <h2 className="display" id="teach-title" data-in>
                  <Lines text={fm.title} />
                </h2>
                <div className="teach__body" data-in>
                  <div className="prose">
                    <Paragraphs text={fm.text} />
                  </div>
                  <p className="status">
                    <i aria-hidden="true"></i>
                    {up.status}
                  </p>
                </div>
                {up.topics.length > 0 && (
                  <ul className="teach__topics" aria-label={up.topicsAria}>
                    {up.topics.map((t, i) => (
                      <li key={i} data-in style={{ ["--d" as string]: `${i * 90}ms` }}>
                        <span>{t.label}</span>
                        {t.title}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="teach__foot">
                  <span className="meta">{fm.meta}</span>
                  <BtnLink to="/formations">{fm.button}</BtnLink>
                </div>
              </div>
            </section>
          ),
          contact: () => (
            <CtaBand title={content.contact.intro.title}>
              <BtnLink to="/contact">{ct.primary}</BtnLink>
              <a className="link" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">
                <span>{ct.secondary}</span> <Arrow />
              </a>
            </CtaBand>
          ),
        }}
      />
    </main>
  );
}
