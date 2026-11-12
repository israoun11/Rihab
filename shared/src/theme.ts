import { DEFAULT_DESIGN } from "./defaults.js";
import type { SiteContent } from "./schema.js";

/** Theme colours and fonts as CSS variables, so the saved design applies before the app starts. */
export function themeCss(design: SiteContent["site"]["design"]): string {
  const d = { ...DEFAULT_DESIGN, ...design };
  const rgb = (hex: string) => {
    const n = Number.parseInt(hex.slice(1), 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  };
  const q = (f: string) => `"${f.replace(/["\\<>]/g, "")}"`;
  return (
    `:root{--ink:${d.ink};--surface:${d.surface};--paper:${d.paper};--wine:${d.wine};--wine-hover:${d.wineHover};` +
    `--muted:${d.muted};--muted-paper:${d.mutedPaper};--rule:rgba(${rgb(d.paper)},0.14);--rule-paper:rgba(${rgb(d.ink)},0.16);--error-paper:${d.wine};` +
    `--serif:${q(d.serif)},"Iowan Old Style","Palatino Linotype",Georgia,serif;--sans:${q(d.sans)},"Helvetica Neue",Arial,system-ui,sans-serif;` +
    `--serif-ar:${q(d.arabicSerif)},${q(d.arabicSans)},serif;--sans-ar:${q(d.arabicSans)},system-ui,sans-serif}`
  );
}

/** Google Fonts stylesheet for the chosen fonts (Arabic files only download when Arabic text is shown). */
export function fontsHref(design: SiteContent["site"]["design"]): string {
  const d = { ...DEFAULT_DESIGN, ...design };
  const fam = (name: string, spec: string) => `family=${encodeURIComponent(name).replace(/%20/g, "+")}${spec}`;
  const italic = (f: string) => (/Instrument Serif|DM Serif Display|Playfair|Cormorant|Fraunces|Libre Caslon/.test(f) ? ":ital@0;1" : "");
  const families = [
    fam(d.sans, ":wght@400;500;600"),
    fam(d.serif, italic(d.serif)),
    fam(d.arabicSans, ":wght@400;500;600"),
    fam(d.arabicSerif, ""),
  ];
  return `https://fonts.googleapis.com/css2?${[...new Set(families)].join("&")}&display=swap`;
}

