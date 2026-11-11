import { useMemo, useState } from "react";
import { fill } from "@rihab/shared";
import { useSite } from "../content/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { useEntrances } from "../hooks/useEntrances";
import { ProjectCard } from "../components/ProjectCard";
import { BtnLink, CtaBand, PageHead } from "../components/Blocks";

const ALL = "tous";

/** Dedicated Projects page: projects grouped by category, uniform cards, category filters. */
export function Projects() {
  const { content, projects, categories } = useSite();
  const p = content.projects;
  const [filter, setFilter] = useState<string>(ALL);
  useSeo(p.seo.title, p.seo.description);

  const groups = useMemo(
    () =>
      categories
        .map((c) => ({ category: c, items: projects.filter((pr) => pr.category === c.slug) }))
        .filter((g) => g.items.length > 0),
    [categories, projects],
  );
  const visible = groups.filter((g) => filter === ALL || g.category.slug === filter);
  const shown = visible.reduce((n, g) => n + g.items.length, 0);
  useEntrances([filter, projects]);

  return (
    <main id="contenu">
      <PageHead {...p.head} />
      <section className="section section--tight">
        <div className="wrap">
          {groups.length > 1 && (
            <div className="filters" role="group" aria-label={p.listing.filterAria}>
              <span className="filters__label" aria-hidden="true">
                {p.listing.filterLabel}
              </span>
              <button className="filter" type="button" aria-pressed={filter === ALL} onClick={() => setFilter(ALL)}>
                {p.listing.allLabel}
              </button>
              {groups.map((g) => (
                <button
                  key={g.category.slug}
                  className="filter"
                  type="button"
                  aria-pressed={filter === g.category.slug}
                  onClick={() => setFilter(g.category.slug)}
                >
                  {g.category.name}
                </button>
              ))}
              <span className="sr-only" aria-live="polite">
                {filter === ALL ? "" : fill(shown > 1 ? p.listing.filterStatusMany : p.listing.filterStatusOne, { n: shown })}
              </span>
            </div>
          )}
          {visible.map((g, gi) => (
            <section className="cat-group" key={g.category.slug} aria-labelledby={`cat-${g.category.slug}`}>
              <h2 className="cat-group__title h3" id={`cat-${g.category.slug}`}>
                {g.category.name}
              </h2>
              <div className="grid index-grid index-grid--uniform">
                {g.items.map((pr, i) => (
                  <ProjectCard key={pr.id} project={pr} linkLabel={p.listing.cardLink} eager={gi === 0 && i < 2} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <CtaBand title={p.cta.title}>
        <BtnLink to="/contact">{p.cta.primary}</BtnLink>
      </CtaBand>
    </main>
  );
}
