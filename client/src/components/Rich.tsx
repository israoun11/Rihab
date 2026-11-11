import { Fragment, type ReactNode } from "react";
import { parseInline, splitLines, splitParagraphs } from "@rihab/shared";

/** Inline markup: *italique*, **gras**. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((seg, i) =>
        seg.kind === "em" ? <em key={i}>{seg.text}</em> : seg.kind === "strong" ? <strong key={i}>{seg.text}</strong> : <Fragment key={i}>{seg.text}</Fragment>,
      )}
    </>
  );
}

/** Lines separated by <br>, as in the original headings. */
export function Lines({ text }: { text: string }) {
  const lines = splitLines(text);
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <Inline text={line} />
        </Fragment>
      ))}
    </>
  );
}

/** One <span> per line (hero title). */
export function SpanLines({ text }: { text: string }) {
  return (
    <>
      {splitLines(text).map((line, i) => (
        <span key={i}>
          <Inline text={line} />
        </span>
      ))}
    </>
  );
}

/** Paragraphs separated by blank lines. */
export function Paragraphs({ text }: { text: string }): ReactNode {
  return (
    <>
      {splitParagraphs(text).map((p, i) => (
        <p key={i}>
          <Lines text={p} />
        </p>
      ))}
    </>
  );
}
