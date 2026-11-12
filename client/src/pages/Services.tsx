import { useSite } from "../content/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { useEntrances } from "../hooks/useEntrances";
import { Lines } from "../components/Rich";
import { BtnLink, CtaBand, PageHead, Sections, Steps, pad2 } from "../components/Blocks";

export function Services() {
  const { content } = useSite();
  const s = content.services;
  useSeo(s.seo.title, s.seo.description);
  useEntrances([s.layout]);
  return (
    <main id="contenu">
      <PageHead {...s.head} />
      <Sections
        layout={s.layout.sections}
        blocks={{
          list: () => (
      <section className="section section--tight">
        <div className="wrap grid">
          <div className="services">
            {s.list.items.map((it, i) => (
              <div className="svc" data-in key={i}>
                <span className="svc__no num">{pad2(i + 1)}</span>
                <h3 className="svc__title">{it.title}</h3>
                <p className="svc__desc">{it.description}</p>
                {it.deliverables.length > 0 && (
                  <ul className="svc__list" aria-label={s.list.deliverablesAria}>
                    {it.deliverables.map((d, j) => (
                      <li key={j}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <div className="scope-note">
            <p className="label">{s.scope.label}</p>
            <p>{s.scope.text}</p>
          </div>
        </div>
      </section>
          ),
          audiences: () => (
      <section className="section">
        <div className="wrap grid">
          <div className="grid s-head" style={{ gridColumn: "1/-1" }}>
            <p className="label">{s.audiences.label}</p>
            <h2 className="display">
              <Lines text={s.audiences.title} />
            </h2>
          </div>
          <ul className="audiences">
            {s.audiences.items.map((it, i) => (
              <li data-in key={i}>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
          ),
          steps: () => (
      <section className="section">
        <div className="wrap grid">
          <div className="grid s-head" style={{ gridColumn: "1/-1" }}>
            <p className="label">{s.steps.label}</p>
            <h2 className="display">
              <Lines text={s.steps.title} />
            </h2>
          </div>
          <Steps items={s.steps.items} />
        </div>
      </section>
          ),
          cta: () => (
            <CtaBand title={s.cta.title}>
              <BtnLink to="/contact">{s.cta.primary}</BtnLink>
            </CtaBand>
          ),
        }}
      />
    </main>
  );
}
