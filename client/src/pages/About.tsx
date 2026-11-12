import { useSite } from "../content/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { useEntrances } from "../hooks/useEntrances";
import { Frame } from "../components/Frame";
import { Paragraphs } from "../components/Rich";
import { BtnLink, CtaBand, PageHead, Sections, TextLink } from "../components/Blocks";

export function About() {
  const { content } = useSite();
  const a = content.about;
  useSeo(a.seo.title, a.seo.description);
  useEntrances([a.layout]);
  return (
    <main id="contenu">
      <PageHead {...a.head} />
      <Sections
        layout={a.layout.sections}
        blocks={{
          bio: () => (
      <section className="section">
        <div className="wrap grid">
          <div className="bio__portrait" data-in>
            <Frame image={a.bio.portrait} ratio="frame--tall" sizes="(max-width: 980px) 90vw, 40vw" />
          </div>
          <div className="bio__text" data-in>
            <p className="lead">{a.bio.lead}</p>
            <div className="prose">
              <Paragraphs text={a.bio.text} />
            </div>
            <TextLink to="/contact">{a.bio.link}</TextLink>
          </div>
        </div>
      </section>
          ),
          timeline: () => (
      <section className="section">
        <div className="wrap grid split">
          <div className="split__label">
            <p className="label">{a.timeline.label}</p>
          </div>
          <div className="split__body">
            <h2 className="h3">{a.timeline.title}</h2>
            <ol className="timeline">
              {a.timeline.items.map((it, i) => (
                <li key={i} data-in>
                  <span className={/\d/.test(it.when) ? "when num" : "when"}>{it.when}</span>
                  <div>
                    <p className="what">{it.what}</p>
                    <p className="where">{it.where}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
          ),
          approach: () => (
      <section className="section">
        <div className="wrap grid split">
          <div className="split__label">
            <p className="label">{a.approach.label}</p>
          </div>
          <div className="split__body">
            <h2 className="h3">{a.approach.title}</h2>
            <div className="prose">
              <Paragraphs text={a.approach.text} />
            </div>
          </div>
        </div>
      </section>
          ),
          tools: () => (
      <section className="section">
        <div className="wrap grid split">
          <div className="split__label">
            <p className="label">{a.tools.label}</p>
          </div>
          <div className="split__body">
            <h2 className="h3">{a.tools.title}</h2>
            <ul className="tools" aria-label={a.tools.softwareAria}>
              {a.tools.software.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <ul className="tools" aria-label={a.tools.skillsAria}>
              {a.tools.skills.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
          ),
          cta: () => (
            <CtaBand title={a.cta.title}>
              <BtnLink to="/contact">{a.cta.primary}</BtnLink>
              <TextLink to="/projets">{a.cta.secondary}</TextLink>
            </CtaBand>
          ),
        }}
      />
    </main>
  );
}
