/**
 * Multilingual content (FR / AR / EN).
 *
 * Storage ("raw" content, what the dashboard edits and MongoDB keeps): the same
 * tree as SiteContent, except that every translatable value is an object with
 * one entry per language, e.g. { fr: "Accueil", ar: "الرئيسية", en: "Home" }.
 * Structure is shared by all languages: list items, their order, images,
 * links, colours and section order are edited once and apply everywhere.
 *
 * Public site ("resolved" content): one language at a time, plain strings, the
 * exact SiteContent shape the pages already use. A missing translation falls
 * back to French so a page is never left with an empty text.
 */
import {
  CONTENT_SCHEMA,
  PAGE_KEYS,
  type FieldDef,
  type ImageValue,
  type LayoutItem,
  type LeafFieldDef,
  type PageDef,
  type SectionDef,
  type SiteContent,
} from "./schema.js";

export const LOCALES = ["fr", "ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
/** Languages other than French are served under /ar/… and /en/…; French keeps the original addresses. */
export const PREFIXED_LOCALES = ["ar", "en"] as const;

export interface LocaleInfo {
  /** Name of the language in that language (language switcher). */
  name: string;
  short: string;
  dir: "ltr" | "rtl";
  ogLocale: string;
}
export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  fr: { name: "Français", short: "FR", dir: "ltr", ogLocale: "fr_TN" },
  ar: { name: "العربية", short: "AR", dir: "rtl", ogLocale: "ar_TN" },
  en: { name: "English", short: "EN", dir: "ltr", ogLocale: "en_GB" },
};

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

export type Localized<T> = { fr: T } & Partial<Record<Exclude<Locale, "fr">, T>>;
export type LocalizedText = Localized<string>;

/** Raw (multilingual) content. Loosely typed: its exact shape follows CONTENT_SCHEMA. */
export type RawContent = Record<string, Record<string, Record<string, unknown>>>;

type Dict = Record<string, unknown>;
export const isDict = (v: unknown): v is Dict => typeof v === "object" && v !== null && !Array.isArray(v);

/* ------------------------------------------------------------------------ */
/* Paths: language prefixes in addresses                                     */
/* ------------------------------------------------------------------------ */

/** Splits "/en/projets/x" into { lang: "en", path: "/projets/x" }. French has no prefix. */
export function splitLocalePath(pathname: string): { lang: Locale; path: string } {
  const m = /^\/(ar|en)(?=\/|$)(.*)$/.exec(pathname);
  if (!m) return { lang: "fr", path: pathname || "/" };
  return { lang: m[1] as Locale, path: m[2] || "/" };
}

/** Adds the language prefix to an internal address ("/contact?x#y" → "/en/contact?x#y"). */
export function localizePath(to: string, lang: Locale): string {
  if (lang === "fr" || !to.startsWith("/")) return to;
  if (to === "/") return `/${lang}`;
  if (to.startsWith("/#") || to.startsWith("/?")) return `/${lang}${to.slice(1)}`;
  return `/${lang}${to}`;
}

/* ------------------------------------------------------------------------ */
/* Which values are translated                                               */
/* ------------------------------------------------------------------------ */

export function isTranslatable(def: LeafFieldDef): boolean {
  return (def.type === "text" || def.type === "stringList") && def.i18n !== false;
}

/* ------------------------------------------------------------------------ */
/* Resolution: raw → one language                                            */
/* ------------------------------------------------------------------------ */

/** Text in the requested language, or French when the translation is empty. */
export function pickText(v: unknown, lang: Locale): string {
  if (typeof v === "string") return v;
  if (!isDict(v)) return "";
  const own = v[lang];
  if (typeof own === "string" && own.trim()) return own;
  return typeof v.fr === "string" ? v.fr : "";
}

function pickList(v: unknown, lang: Locale): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (!isDict(v)) return [];
  const own = v[lang];
  if (Array.isArray(own) && own.length) return own as string[];
  return Array.isArray(v.fr) ? (v.fr as string[]) : [];
}

export type RawImage = Omit<ImageValue, "alt"> & { alt: LocalizedText };

export function resolveImage(raw: unknown, lang: Locale): ImageValue | null {
  if (!isDict(raw) || typeof raw.src !== "string") return null;
  return { ...(raw as unknown as ImageValue), alt: pickText(raw.alt, lang) };
}

export function resolveLeaf(def: LeafFieldDef, raw: unknown, lang: Locale): unknown {
  switch (def.type) {
    case "text":
      return def.i18n === false ? pickText(raw, "fr") : pickText(raw, lang);
    case "stringList":
      return def.i18n === false ? pickList(raw, "fr") : pickList(raw, lang);
    case "image":
      return resolveImage(raw, lang);
    default:
      return raw;
  }
}

export function resolveField(def: FieldDef, raw: unknown, lang: Locale): unknown {
  if (def.type === "list") {
    return (Array.isArray(raw) ? raw : []).map((item) => {
      const it = isDict(item) ? item : {};
      const out: Dict = {};
      for (const [k, sub] of Object.entries(def.fields)) out[k] = resolveLeaf(sub, it[k], lang);
      return out;
    });
  }
  return resolveLeaf(def, raw, lang);
}

export function resolveSection(def: SectionDef, raw: unknown, lang: Locale): Dict {
  const src = isDict(raw) ? raw : {};
  const out: Dict = {};
  for (const [k, f] of Object.entries(def.fields)) out[k] = resolveField(f, src[k], lang);
  return out;
}

/** Complete raw content → the content of one language, as the public pages use it. */
export function resolveContent(raw: RawContent, lang: Locale): SiteContent {
  const out: Dict = {};
  for (const page of PAGE_KEYS) {
    const def = CONTENT_SCHEMA[page] as PageDef;
    const p: Dict = {};
    for (const [s, sdef] of Object.entries(def.sections)) p[s] = resolveSection(sdef, raw[page]?.[s], lang);
    out[page] = p;
  }
  return out as unknown as SiteContent;
}

/* ------------------------------------------------------------------------ */
/* Building raw content from one complete content per language               */
/* ------------------------------------------------------------------------ */

type PerLang = Record<Locale, unknown>;
const at = (v: PerLang, f: (x: unknown) => unknown): PerLang => ({ fr: f(v.fr), ar: f(v.ar), en: f(v.en) });

export function localizeLeaf(def: LeafFieldDef, v: PerLang): unknown {
  if (isTranslatable(def)) return { fr: v.fr, ar: v.ar, en: v.en };
  if (def.type === "image") {
    if (!isDict(v.fr)) return null;
    const a = (x: unknown) => (isDict(x) && typeof x.alt === "string" ? x.alt : "");
    return { ...v.fr, alt: { fr: a(v.fr), ar: a(v.ar), en: a(v.en) } };
  }
  return v.fr;
}

export function localizeField(def: FieldDef, v: PerLang): unknown {
  if (def.type !== "list") return localizeLeaf(def, v);
  const fr = Array.isArray(v.fr) ? v.fr : [];
  return fr.map((_, i) => {
    const item = at(v, (x) => (Array.isArray(x) && isDict(x[i]) ? x[i] : {}));
    const out: Dict = {};
    for (const [k, sub] of Object.entries(def.fields)) out[k] = localizeLeaf(sub, at(item, (x) => (x as Dict)[k]));
    return out;
  });
}

export function localizeContent(perLang: Record<Locale, SiteContent>): RawContent {
  const out: RawContent = {};
  for (const page of PAGE_KEYS) {
    const def = CONTENT_SCHEMA[page] as PageDef;
    out[page] = {};
    for (const [s, sdef] of Object.entries(def.sections)) {
      const sec: Dict = {};
      for (const [k, f] of Object.entries(sdef.fields)) {
        sec[k] = localizeField(
          f,
          at(perLang as unknown as PerLang, (c) => ((c as Dict)[page] as Dict)[s] && (((c as Dict)[page] as Dict)[s] as Dict)[k]),
        );
      }
      out[page]![s] = sec;
    }
  }
  return out;
}

/* ------------------------------------------------------------------------ */
/* Upgrading content saved before the site was multilingual                 */
/* ------------------------------------------------------------------------ */

/**
 * A plain (French-only) stored value becomes { fr }. When the French text is
 * still the original one, its default translations are reused, so content
 * that was never edited is translated straight away.
 */
function upgradeText(stored: unknown, def: unknown): unknown {
  if (typeof stored !== "string") return stored;
  if (isDict(def) && def.fr === stored) return def;
  return { fr: stored };
}

export function upgradeLeaf(def: LeafFieldDef, stored: unknown, defaults: unknown): unknown {
  if (def.type === "text") {
    if (def.i18n === false) return isDict(stored) && typeof stored.fr === "string" ? stored.fr : stored;
    return upgradeText(stored, defaults);
  }
  if (def.type === "stringList") {
    if (def.i18n === false) return isDict(stored) && Array.isArray(stored.fr) ? stored.fr : stored;
    if (!Array.isArray(stored)) return stored;
    if (isDict(defaults) && JSON.stringify(defaults.fr) === JSON.stringify(stored)) return defaults;
    return { fr: stored };
  }
  if (def.type === "image" && isDict(stored) && typeof stored.alt === "string") {
    return { ...stored, alt: upgradeText(stored.alt, isDict(defaults) ? defaults.alt : undefined) };
  }
  return stored;
}

export function upgradeField(def: FieldDef, stored: unknown, defaults: unknown): unknown {
  if (def.type !== "list") return upgradeLeaf(def, stored, defaults);
  if (!Array.isArray(stored)) return stored;
  const defList = Array.isArray(defaults) ? defaults : [];
  return stored.map((item, i) => {
    if (!isDict(item)) return item;
    const d = isDict(defList[i]) ? (defList[i] as Dict) : {};
    const out: Dict = { ...item };
    for (const [k, sub] of Object.entries(def.fields)) if (k in item) out[k] = upgradeLeaf(sub, item[k], d[k]);
    return out;
  });
}

/* ------------------------------------------------------------------------ */
/* Section order and visibility                                              */
/* ------------------------------------------------------------------------ */

/** Keeps known keys once, in the saved order, and appends blocks added since (visible). */
export function normalizeLayout(items: readonly { key: string }[], value: unknown): LayoutItem[] {
  const known = new Set(items.map((i) => i.key));
  const out: LayoutItem[] = [];
  const seen = new Set<string>();
  for (const it of Array.isArray(value) ? value : []) {
    if (!isDict(it) || typeof it.key !== "string" || !known.has(it.key) || seen.has(it.key)) continue;
    seen.add(it.key);
    out.push({ key: it.key, visible: it.visible !== false });
  }
  for (const i of items) if (!seen.has(i.key)) out.push({ key: i.key, visible: true });
  return out;
}

/** Keys of the visible blocks, in order. */
export const visibleKeys = (layout: readonly LayoutItem[]): string[] => layout.filter((i) => i.visible).map((i) => i.key);

/* ------------------------------------------------------------------------ */
/* Missing translations (dashboard indicators)                               */
/* ------------------------------------------------------------------------ */

const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export function leafGaps(def: LeafFieldDef, raw: unknown, lang: Locale): number {
  if (lang === "fr") return 0;
  if (isTranslatable(def)) {
    if (!isDict(raw)) return 0;
    if (def.type === "text") return filled(raw.fr) && !filled(raw[lang]) ? 1 : 0;
    const fr = raw.fr;
    const own = raw[lang];
    return Array.isArray(fr) && fr.length > 0 && !(Array.isArray(own) && own.length > 0 && own.every(filled)) ? 1 : 0;
  }
  if (def.type === "image" && isDict(raw) && isDict(raw.alt)) return filled(raw.alt.fr) && !filled(raw.alt[lang]) ? 1 : 0;
  return 0;
}

export function fieldGaps(def: FieldDef, raw: unknown, lang: Locale): number {
  if (def.type !== "list") return leafGaps(def, raw, lang);
  let n = 0;
  for (const item of Array.isArray(raw) ? raw : []) {
    if (!isDict(item)) continue;
    for (const [k, sub] of Object.entries(def.fields)) n += leafGaps(sub, item[k], lang);
  }
  return n;
}

export function sectionGaps(def: SectionDef, raw: unknown, lang: Locale): number {
  const src = isDict(raw) ? raw : {};
  let n = 0;
  for (const [k, f] of Object.entries(def.fields)) n += fieldGaps(f, src[k], lang);
  return n;
}

export function contentGaps(raw: RawContent, lang: Locale): Record<string, number> {
  const out: Record<string, number> = {};
  for (const page of PAGE_KEYS) {
    const def = CONTENT_SCHEMA[page] as PageDef;
    let n = 0;
    for (const [s, sdef] of Object.entries(def.sections)) n += sectionGaps(sdef, raw[page]?.[s], lang);
    out[page] = n;
  }
  return out;
}
