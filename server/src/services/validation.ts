import { z } from "zod";
import { normalizeLayout, type FieldDef, type LeafFieldDef, type SectionDef } from "@rihab/shared";

// French validation messages.
z.config(z.locales.fr());

const ASSET_SRC = /^\/assets\/img\/[\w.-]+\.(?:svg|jpe?g|png|webp|avif|gif)$/i;
const MEDIA_SRC = /^\/media\/[a-f0-9]{24}$/;

export const imageSrcSchema = z
  .string()
  .max(300)
  .refine((v) => ASSET_SRC.test(v) || MEDIA_SRC.test(v), {
    message: "Source d’image invalide : utilisez une image de la médiathèque.",
  });

const srcSetSchema = z
  .string()
  .max(600)
  .refine(
    (v) =>
      v
        .split(",")
        .map((c) => c.trim().split(/\s+/))
        .every((parts) => parts.length === 2 && ASSET_SRC.test(parts[0] ?? "") && /^\d+w$/.test(parts[1] ?? "")),
    { message: "srcset invalide." },
  );

/**
 * Translatable text: { fr, ar?, en? }. French is the reference language (required
 * when the field is), translations may be empty (the French text is then shown).
 * A plain string is accepted too and taken as the French text.
 */
export function localizedText(max: number, required: boolean, label = "Ce champ") {
  const fr = z.string().trim().max(max);
  const tr = z.string().trim().max(max).optional();
  const obj = z
    .object({ fr: required ? fr.min(1, `« ${label} » ne peut pas être vide en français.`) : fr, ar: tr, en: tr })
    .strict()
    .transform((v) => {
      const out: { fr: string; ar?: string; en?: string } = { fr: v.fr };
      if (v.ar) out.ar = v.ar;
      if (v.en) out.en = v.en;
      return out;
    });
  return z.preprocess((v) => (typeof v === "string" ? { fr: v } : v), obj);
}

function localizedList() {
  const list = z.array(z.string().trim().min(1).max(300)).max(50);
  return z.preprocess(
    (v) => (Array.isArray(v) ? { fr: v } : v),
    z
      .object({ fr: list, ar: list.optional(), en: list.optional() })
      .strict()
      .transform((v) => {
        const out: { fr: string[]; ar?: string[]; en?: string[] } = { fr: v.fr };
        if (v.ar?.length) out.ar = v.ar;
        if (v.en?.length) out.en = v.en;
        return out;
      }),
  );
}

export const imageSchema = z
  .object({
    src: imageSrcSchema,
    alt: localizedText(300, false),
    width: z.number().int().min(1).max(20000),
    height: z.number().int().min(1).max(20000),
    srcSet: srcSetSchema.optional(),
    demo: z.boolean().optional(),
  })
  .strict();

const urlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https?:\/\/[^\s]+$/i.test(v) || /^mailto:[^\s]+$/i.test(v) || /^tel:\+?[\d\s.-]+$/i.test(v), {
    message: "Adresse invalide : elle doit commencer par https://, mailto: ou tel:.",
  });

function leafSchema(def: LeafFieldDef): z.ZodType {
  switch (def.type) {
    case "text": {
      const max = def.multiline ? 5000 : 400;
      if (def.i18n !== false) return localizedText(max, !def.optional, def.label);
      const base = z.string().trim().max(max);
      return z.preprocess(
        (v) => (v && typeof v === "object" && "fr" in v ? (v as { fr: unknown }).fr : v),
        def.optional ? base : base.min(1, `« ${def.label} » ne peut pas être vide.`),
      );
    }
    case "url":
      return urlSchema;
    case "image":
      return def.optional ? imageSchema.nullable() : imageSchema;
    case "stringList":
      return def.i18n === false ? z.array(z.string().trim().min(1).max(300)).max(50) : localizedList();
    case "color":
      return z.string().regex(/^#[0-9a-fA-F]{6}$/, `« ${def.label} » : couleur invalide (format #RRGGBB).`).transform((v) => v.toUpperCase());
    case "select": {
      const values = def.options.map((o) => o.value);
      return z.string().refine((v) => values.includes(v), { message: `« ${def.label} » : choix invalide.` });
    }
    case "boolean":
      return z.boolean();
    case "layout":
      return z
        .array(z.object({ key: z.string().max(60), visible: z.boolean() }).strict())
        .max(50)
        .transform((v) => normalizeLayout(def.items, v));
  }
}

export function fieldSchema(def: FieldDef): z.ZodType {
  if (def.type === "list") {
    const shape: Record<string, z.ZodType> = {};
    for (const [key, sub] of Object.entries(def.fields)) shape[key] = leafSchema(sub);
    return z.array(z.object(shape).strict()).max(50);
  }
  return leafSchema(def);
}

const sectionCache = new WeakMap<SectionDef, z.ZodType>();
export function sectionSchema(def: SectionDef): z.ZodType {
  let s = sectionCache.get(def);
  if (!s) {
    const shape: Record<string, z.ZodType> = {};
    for (const [key, f] of Object.entries(def.fields)) shape[key] = fieldSchema(f);
    s = z.object(shape).strict();
    sectionCache.set(def, s);
  }
  return s;
}

/* ---------- Projects & categories ---------- */

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez des minuscules, chiffres et tirets (ex. : mon-projet).");

export const projectInputSchema = z
  .object({
    slug: slugSchema,
    title: localizedText(120, true, "Nom du projet"),
    place: localizedText(120, true, "Lieu"),
    category: slugSchema,
    typeLabel: localizedText(80, true, "Type de projet"),
    description: localizedText(2000, true, "Description"),
    attribution: localizedText(300, false).default({ fr: "" }),
    cover: imageSchema,
    images: z.array(imageSchema).min(1, "Ajoutez au moins une image au projet.").max(30),
  })
  .strict();

export const categoryInputSchema = z
  .object({
    slug: slugSchema,
    name: localizedText(80, true, "Nom de la catégorie"),
  })
  .strict();

export const categoryUpdateSchema = z.object({ name: localizedText(80, true, "Nom de la catégorie") }).strict();

export const orderSchema = z.object({ ids: z.array(z.string().regex(/^[a-f0-9]{24}$/)).min(1).max(500) }).strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(200),
    password: z.string().min(1).max(200),
  })
  .strict();

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/, "Identifiant invalide.");
