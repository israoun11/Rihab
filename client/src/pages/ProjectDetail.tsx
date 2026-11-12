import { useParams } from "react-router-dom";
import { Link } from "../i18n/Link";
import { useSite } from "../content/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { useEntrances } from "../hooks/useEntrances";
import { Frame, type FrameRatio } from "../components/Frame";
import { BtnLink, CtaBand, Sections, TextLink, pad2 } from "../components/Blocks";
import { NotFound } from "./NotFound";

/** Gallery layout of the original design, repeated for longer galleries. */
const GALLERY: { cls: string; ratio: FrameRatio }[] = [
  { cls: "g1", ratio: "frame--land" },
  { cls: "g2", ratio: "frame--port" },
  { cls: "g3", ratio: "frame--land" },
];

export function ProjectDetail() {
  const { slug } = useParams();
  const { content, projects, categories } = useSite();
  const index = projects.findIndex((p) => p.slug === slug);
  const p = projects[index];
  const L = content.projectDetail.labels;
  const cta = content.projectDetail.cta;
  const name = content.site.identity.name;

  useSeo(p ? `${p.title} · ${name}` : name, p ? `${p.title}, ${p.place} · ${p.typeLabel}. ${p.description}` : "");
  useEntrances([slug, content.projectDetail.layout]);

  if (!p) return <NotFound />;

  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : undefined;
  const catName = categories.find((c) => c.slug === p.category)?.name ?? p.category;
  const category = catName === p.typeLabel ? catName : `${catName} · ${p.typeLabel}`;
  const [hero, ...gallery] = p.images;
  const nextImg = next?.images[0] ?? next?.cover;
  const hasDemo = p.images.some((i) => i.demo);

  return (
    <main id="contenu">
      <section className="pd-head">
        <div className="wrap grid">
          <p className="label" style={{ gridColumn: "1/-1" }}>
            <Link to="/projets" style={{ textDecoration: "none" }}>
              {L.breadcrumb}
            </Link>
            &nbsp;/&nbsp;{pad2(index + 1)}
          </p>
          <h1 className="page-title">{p.title}</h1>
          <dl className="pd-facts">
            <div>
              <dt>{L.place}</dt>
              <dd>{p.place}</dd>
            </div>
            <div>
              <dt>{L.category}</dt>
              <dd>{category}</dd>
            </div>
            {p.attribution && (
              <div>
                <dt>{L.context}</dt>
                <dd>{p.attribution}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>
      {hero && (
        <div className="wrap pd-hero">
          <Frame image={hero} ratio="frame--wide" eager />
        </div>
      )}
      <div className="wrap grid pd-intro">
        <p className="label">{L.intro}</p>
        <p className="lead">{p.description}</p>
        {hasDemo && <p className="note">{L.demoNote}</p>}
      </div>
      <Sections
        layout={content.projectDetail.layout.sections}
        blocks={{
          gallery: () =>
            gallery.length > 0 && (
        <div className="wrap grid pd-gallery">
          {gallery.map((img, i) => {
            const g = GALLERY[i % GALLERY.length] ?? GALLERY[0]!;
            return (
              <figure className={g.cls} data-in style={{ margin: 0 }} key={`${img.src}-${i}`}>
                <Frame image={img} ratio={g.ratio} />
                {img.alt && <figcaption>{img.alt}</figcaption>}
              </figure>
            );
          })}
        </div>
            ),
          next: () =>
            next &&
            nextImg && (
        <div className="wrap" style={{ marginTop: "clamp(80px,10vw,160px)" }}>
          <Link className="next-proj" to={`/projets/${next.slug}`}>
            <span className="label">{L.next}</span>
            <span className="next-proj__title">{next.title}</span>
            <span className="next-proj__media">
              <Frame image={nextImg} ratio="frame--land" tag={false} />
            </span>
            <span className="meta">
              {next.place} · {next.typeLabel}
            </span>
          </Link>
        </div>
            ),
          cta: () => (
            <CtaBand title={cta.title}>
              <BtnLink to="/contact">{cta.primary}</BtnLink>
              <TextLink to="/projets">{cta.secondary}</TextLink>
            </CtaBand>
          ),
        }}
      />
    </main>
  );
}
