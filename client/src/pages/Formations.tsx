import { useSite } from "../content/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { useEntrances } from "../hooks/useEntrances";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Lines } from "../components/Rich";
import { Frame } from "../components/Frame";
import { BtnLink, PageHead } from "../components/Blocks";

export function Formations() {
  const { content } = useSite();
  const f = content.formations;
  useSeo(f.seo.title, f.seo.description);
  useEntrances([]);
  return (
    <main id="contenu">
      <PageHead {...f.head} />
      {f.image.image && (
        <section className="section fm-image" aria-label={f.image.image.alt || undefined}>
          <div className="wrap">
            <div data-in>
              <Frame image={f.image.image} ratio="frame--wide" sizes="(max-width: 1440px) 92vw, 1320px" />
            </div>
          </div>
        </section>
      )}
      {f.courses.items.length > 0 && (
        <section className="section on-paper courses" aria-labelledby="courses-title">
          <div className="wrap">
            <div className="courses__head">
              <p className="courses__label">{f.courses.label}</p>
              <h2 className="courses__title" id="courses-title">
                {f.courses.title}
              </h2>
              <i className="courses__rule" aria-hidden="true"></i>
            </div>
            <ul className={`courses__list${f.courses.items.some((c) => c.logo) ? " has-logos" : ""}`}>
              {f.courses.items.map((c, i) => (
                <li className="course" key={i} data-in style={{ ["--d" as string]: `${i * 70}ms` }}>
                  {c.logo ? (
                    <img className="course__logo" src={c.logo.src} alt={c.logo.alt} width={c.logo.width} height={c.logo.height} loading="lazy" decoding="async" />
                  ) : (
                    <span className="course__logo" aria-hidden="true"></span>
                  )}
                  <h3 className="course__name">{c.name}</h3>
                  <p className="course__text">
                    {c.text.split("\n").map((line, j) => (
                      <Fragment key={j}>
                        {j > 0 && <br />}
                        {line}
                      </Fragment>
                    ))}
                  </p>
                  <Link className="course__btn" to="/contact?sujet=formations#formulaire" aria-label={`${c.button} : ${c.name}`}>
                    {c.button}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <section className="section on-paper teach">
        <div className="wrap grid">
          <p className="label" style={{ gridColumn: "1/-1" }}>
            {f.upcoming.label}
          </p>
          <h2 className="display">
            <Lines text={f.upcoming.title} />
          </h2>
          <div className="teach__body">
            <p className="status">
              <i aria-hidden="true"></i>
              {f.upcoming.status}
            </p>
            <div className="prose">
              <p>{f.upcoming.text}</p>
            </div>
          </div>
          <ul className="teach__topics" aria-label="Thèmes des futures formations">
            {f.upcoming.topics.map((t, i) => (
              <li key={i}>
                <span>{t.label}</span>
                {t.title}
              </li>
            ))}
          </ul>
          <div className="teach__foot">
            <span className="meta">{f.upcoming.audience}</span>
            <BtnLink to="/contact?sujet=formations#formulaire">{f.upcoming.button}</BtnLink>
          </div>
        </div>
      </section>
    </main>
  );
}
