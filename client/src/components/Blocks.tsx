import { Fragment, type ReactNode } from "react";
import { visibleKeys, type LayoutItem } from "@rihab/shared";
import { Link } from "../i18n/Link";
import { Arrow } from "./Arrow";
import { Lines } from "./Rich";

export function PageHead({ label, title, lead }: { label: string; title: string; lead: string }) {
  return (
    <section className="page-head">
      <div className="wrap grid">
        <p className="label">{label}</p>
        <h1 className="page-title">
          <Lines text={title} />
        </h1>
        <p className="lead">{lead}</p>
      </div>
    </section>
  );
}

export function CtaBand({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section cta-band">
      <div className="wrap grid">
        <h2 className="display" data-in>
          <Lines text={title} />
        </h2>
        <div className="btn-row">{children}</div>
      </div>
    </section>
  );
}

export function BtnLink({ to, children, ghost = false }: { to: string; children: ReactNode; ghost?: boolean }) {
  return (
    <Link className={ghost ? "btn btn--ghost" : "btn"} to={to}>
      {children} <Arrow />
    </Link>
  );
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="link" to={to}>
      <span>{children}</span> <Arrow />
    </Link>
  );
}

export function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="steps">
      {items.map((s, i) => (
        <li key={i} className="step" data-in style={{ ["--d" as string]: `${i * 90}ms` }}>
          <span className="step__no num">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="step__title">{s.title}</h3>
          <p>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Renders the sections of a page in the order chosen in the dashboard
 * (« Sections de la page »), skipping the hidden ones.
 */
export function Sections({ layout, blocks }: { layout: LayoutItem[]; blocks: Record<string, () => ReactNode> }) {
  return (
    <>
      {visibleKeys(layout).map((k) => (
        <Fragment key={k}>{blocks[k]?.()}</Fragment>
      ))}
    </>
  );
}
