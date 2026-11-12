import {
  CONTENT_SCHEMA,
  DEFAULT_RAW_CONTENT,
  PAGE_KEYS,
  getSectionDef,
  isDict,
  resolveContent,
  upgradeField,
  type Locale,
  type PageDef,
  type RawContent,
  type SiteContent,
} from "@rihab/shared";
import { ContentPage } from "../models/index.js";
import { fieldSchema, sectionSchema } from "./validation.js";
import { badRequest, notFound } from "../lib/httpError.js";

type Dict = Record<string, unknown>;

/**
 * Stored values override defaults field by field. Values saved before the site
 * was multilingual (plain French strings) are upgraded on the fly. A stored
 * value that no longer matches the schema (e.g. after a schema change) falls
 * back to the default, so the public site always receives complete, valid content.
 */
export function mergeWithDefaults(stored: Partial<Record<string, unknown>>): RawContent {
  const out: RawContent = {};
  for (const page of PAGE_KEYS) {
    const pageDef = CONTENT_SCHEMA[page] as PageDef;
    const defaults = DEFAULT_RAW_CONTENT[page] ?? {};
    const storedPage = isDict(stored[page]) ? (stored[page] as Dict) : {};
    const pageOut: Record<string, Dict> = {};
    for (const [sectionKey, sectionDef] of Object.entries(pageDef.sections)) {
      const defSection = (defaults[sectionKey] ?? {}) as Dict;
      const storedSection = isDict(storedPage[sectionKey]) ? (storedPage[sectionKey] as Dict) : {};
      const sectionOut: Dict = {};
      for (const [fieldKey, fieldDef] of Object.entries(sectionDef.fields)) {
        const candidate = storedSection[fieldKey];
        const parsed =
          candidate === undefined ? null : fieldSchema(fieldDef).safeParse(upgradeField(fieldDef, candidate, defSection[fieldKey]));
        sectionOut[fieldKey] = parsed?.success ? parsed.data : structuredClone(defSection[fieldKey]);
      }
      pageOut[sectionKey] = sectionOut;
    }
    out[page] = pageOut;
  }
  return out;
}

/** Every language, as stored (dashboard). */
export async function getContent(): Promise<RawContent> {
  const docs = await ContentPage.find({}).lean();
  const stored: Dict = {};
  for (const d of docs) stored[String(d._id)] = d.data;
  return mergeWithDefaults(stored);
}

/** One language, as the public site shows it. */
export async function getPublicContent(lang: Locale): Promise<SiteContent> {
  return resolveContent(await getContent(), lang);
}

export async function updateSection(page: string, section: string, body: unknown): Promise<RawContent> {
  const def = getSectionDef(page, section);
  if (!def) throw notFound("Section inconnue.");
  const parsed = sectionSchema(def).safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      "Certaines valeurs ne sont pas valides.",
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }
  await ContentPage.updateOne({ _id: page }, { $set: { [`data.${section}`]: parsed.data } }, { upsert: true });
  return getContent();
}

/** Restores a section to the original text and images (in every language). */
export async function resetSection(page: string, section: string): Promise<RawContent> {
  if (!getSectionDef(page, section)) throw notFound("Section inconnue.");
  await ContentPage.updateOne({ _id: page }, { $unset: { [`data.${section}`]: "" } });
  return getContent();
}
