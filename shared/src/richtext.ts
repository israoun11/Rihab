/**
 * Minimal, safe markup used in editable texts (never rendered as raw HTML):
 *   *texte*   → italique (<em>)
 *   **texte** → gras (<strong>)
 *   retour à la ligne → nouvelle ligne, ligne vide → nouveau paragraphe
 *   {email}, {phone}, {n}… → remplacés par fill()
 */

export type InlineKind = "text" | "em" | "strong";
export interface InlineSegment {
  kind: InlineKind;
  text: string;
}

const INLINE = /\*\*([^*]+?)\*\*|\*([^*]+?)\*/g;

export function parseInline(input: string): InlineSegment[] {
  const out: InlineSegment[] = [];
  let last = 0;
  for (const m of input.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ kind: "text", text: input.slice(last, idx) });
    if (m[1] !== undefined) out.push({ kind: "strong", text: m[1] });
    else if (m[2] !== undefined) out.push({ kind: "em", text: m[2] });
    last = idx + m[0].length;
  }
  if (last < input.length) out.push({ kind: "text", text: input.slice(last) });
  return out;
}

/** Splits into lines, dropping trailing whitespace and empty lines. */
export function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
}

/** Splits into paragraphs separated by one or more blank lines. */
export function splitParagraphs(input: string): string[] {
  return input
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Replaces {token} placeholders. Unknown tokens are left as they are. */
export function fill(input: string, vars: Record<string, string | number>): string {
  return input.replace(/\{(\w+)\}/g, (all, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : all,
  );
}

/** Plain text version (markup removed), for document titles and attributes. */
export function plain(input: string): string {
  return parseInline(input)
    .map((s) => s.text)
    .join("")
    .replace(/\s*\r?\n\s*/g, " ")
    .trim();
}
