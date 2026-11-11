import { useSite } from "../content/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { Lines } from "../components/Rich";
import { TextLink } from "../components/Blocks";

export function NotFound() {
  const { content } = useSite();
  const n = content.site.notFound;
  useSeo(`${n.label} · ${content.site.identity.name}`, n.text);
  return (
    <main id="contenu">
      <section className="page-head">
        <div className="wrap grid">
          <p className="label">{n.label}</p>
          <h1 className="page-title">
            <Lines text={n.title} />
          </h1>
          <p className="lead">{n.text}</p>
        </div>
      </section>
      <section className="section section--tight">
        <div className="wrap">
          <TextLink to="/">{n.link}</TextLink>
        </div>
      </section>
    </main>
  );
}
