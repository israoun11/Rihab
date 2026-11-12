import { Link } from "../i18n/Link";
import type { Project } from "@rihab/shared";
import { Frame } from "./Frame";
import { Arrow } from "./Arrow";

interface Props {
  project: Project;
  linkLabel: string;
  eager?: boolean;
}

/**
 * Project card: same image proportions for every project (16:10 frame),
 * then only the location, the type of project and the discovery link.
 */
export function ProjectCard({ project, linkLabel, eager = false }: Props) {
  const href = `/projets/${project.slug}`;
  return (
    <article className="proj proj--compact" data-cat={project.category} data-in>
      <Link className="proj__media" to={href} tabIndex={-1} aria-hidden="true">
        <Frame image={project.cover} ratio="frame--land" eager={eager} />
      </Link>
      <div className="proj__info">
        <p className="meta">
          {project.place} · {project.typeLabel}
        </p>
        <Link className="link" to={href} aria-label={`${linkLabel} ${project.title}`}>
          <span>{linkLabel}</span> <Arrow />
        </Link>
      </div>
    </article>
  );
}
