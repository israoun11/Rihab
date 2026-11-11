import {
  CONTENT_SCHEMA,
  DEFAULT_CONTENT,
  PAGE_KEYS,
  getSectionDef,
  type PageDef,
  type SiteContent,
} from "@rihab/shared";
import { ContentPage } from "../models/index.js";
import { fieldSchema, sectionSchema } from "./validation.js";
import { badRequest, notFound } from "../lib/httpError.js";

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Stored values override defaults field by field. A stored value that no longer
 * matches the schema (e.g. after a schema change) falls back to the default,
 * so the public site always receives complete, valid content.
 */
export function mergeWithDefaults(stored: Partial<Record<string, unknown>>): SiteContent {
  const out: Dict = {};
  for (const page of PAGE_KEYS) {
    const pageDef = CONTENT_SCHEMA[page] as PageDef;
    const defaults = DEFAULT_CONTENT[page] as unknown as Dict;
    const storedPage = isDict(stored[page]) ? (stored[page] as Dict) : {};
    const pageOut: Dict = {};
    for (const [sectionKey, sectionDef] of Object.entries(pageDef.sections)) {
      const defSection = defaults[sectionKey] as Dict;
      const storedSection = isDict(storedPage[sectionKey]) ? (storedPage[sectionKey] as Dict) : {};
      const sectionOut: Dict = {};
      for (const [fieldKey, fieldDef] of Object.entries(sectionDef.fields)) {
        const candidate = storedSection[fieldKey];
        const parsed = candidate === undefined ? null : fieldSchema(fieldDef).safeParse(candidate);
        sectionOut[fieldKey] = parsed?.success ? parsed.data : defSection[fieldKey];
      }
      pageOut[sectionKey] = sectionOut;
    }
    out[page] = pageOut;
  }
  return out as unknown as SiteContent;
}

export async function getContent(): Promise<SiteContent> {
  const docs = await ContentPage.find({}).lean();
  const stored: Dict = {};
  for (const d of docs) stored[String(d._id)] = d.data;
  return mergeWithDefaults(stored);
}

export async function updateSection(page: string, section: string, body: unknown): Promise<SiteContent> {
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

/** Restores a section to the original text and images. */
export async function resetSection(page: string, section: string): Promise<SiteContent> {
  if (!getSectionDef(page, section)) throw notFound("Section inconnue.");
  await ContentPage.updateOne({ _id: page }, { $unset: { [`data.${section}`]: "" } });
  return getContent();
}
