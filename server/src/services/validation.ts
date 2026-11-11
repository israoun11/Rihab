import { z } from "zod";
import type { FieldDef, LeafFieldDef, SectionDef } from "@rihab/shared";

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

export const imageSchema = z
  .object({
    src: imageSrcSchema,
    alt: z.string().trim().max(300),
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
      const base = z.string().trim().max(max);
      return def.optional ? base : base.min(1, `« ${def.label} » ne peut pas être vide.`);
    }
    case "url":
      return urlSchema;
    case "image":
      return def.optional ? imageSchema.nullable() : imageSchema;
    case "stringList":
      return z.array(z.string().trim().min(1).max(300)).max(50);
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
    title: z.string().trim().min(1).max(120),
    place: z.string().trim().min(1).max(120),
    category: slugSchema,
    typeLabel: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(2000),
    attribution: z.string().trim().max(300).default(""),
    cover: imageSchema,
    images: z.array(imageSchema).min(1, "Ajoutez au moins une image au projet.").max(30),
  })
  .strict();

export const categoryInputSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(80),
  })
  .strict();

export const categoryUpdateSchema = z.object({ name: z.string().trim().min(1).max(80) }).strict();

export const orderSchema = z.object({ ids: z.array(z.string().regex(/^[a-f0-9]{24}$/)).min(1).max(500) }).strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(200),
    password: z.string().min(1).max(200),
  })
  .strict();

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/, "Identifiant invalide.");
