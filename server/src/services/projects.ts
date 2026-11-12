import {
  DEFAULT_CATEGORIES,
  DEFAULT_PROJECTS,
  isDict,
  resolveCategory,
  resolveProject,
  type Category,
  type CategoryRecord,
  type Locale,
  type LocalizedText,
  type Project,
  type ProjectRecord,
  type RawImage,
} from "@rihab/shared";
import { CategoryModel, ProjectModel, type CategoryDoc, type ProjectDoc } from "../models/index.js";
import { badRequest, conflict, notFound } from "../lib/httpError.js";
import { categoryInputSchema, categoryUpdateSchema, orderSchema, projectInputSchema } from "./validation.js";

/** Stored text → { fr, ar?, en? } (plain strings come from data saved before the site was multilingual). */
export function asLocalized(v: unknown): LocalizedText {
  if (typeof v === "string") return { fr: v };
  if (!isDict(v)) return { fr: "" };
  const out: LocalizedText = { fr: typeof v.fr === "string" ? v.fr : "" };
  if (typeof v.ar === "string" && v.ar) out.ar = v.ar;
  if (typeof v.en === "string" && v.en) out.en = v.en;
  return out;
}

interface ImgDoc {
  src: string;
  alt?: unknown;
  width: number;
  height: number;
  srcSet?: string | null;
  demo?: boolean | null;
}

/** True for a stored image that can be shown (an object with a src). Data written outside the dashboard can hold null or {}. */
const isImageDoc = (i: unknown): i is ImgDoc => isDict(i) && typeof i.src === "string" && i.src !== "";

/** Stored image → RawImage, or null when the stored value is not a usable image. */
const toImage = (i: unknown): RawImage | null => {
  if (!isImageDoc(i)) return null;
  const img: RawImage = { src: i.src, alt: asLocalized(i.alt), width: Number(i.width) || 0, height: Number(i.height) || 0 };
  if (i.srcSet) img.srcSet = i.srcSet;
  if (i.demo) img.demo = true;
  return img;
};

export const toProject = (d: ProjectDoc): ProjectRecord => ({
  id: String(d._id),
  slug: d.slug,
  title: asLocalized(d.title),
  place: asLocalized(d.place),
  category: d.category,
  typeLabel: asLocalized(d.typeLabel),
  description: asLocalized(d.description),
  attribution: asLocalized(d.attribution),
  cover: toImage(d.cover),
  images: (Array.isArray(d.images) ? (d.images as unknown[]) : []).map(toImage).filter((i): i is RawImage => i !== null),
  order: d.order ?? 0,
});

export const toCategory = (d: CategoryDoc): CategoryRecord => ({
  id: String(d._id),
  slug: d.slug,
  name: asLocalized(d.name),
  order: d.order ?? 0,
});

const issues = (e: { issues: { path: PropertyKey[]; message: string }[] }) =>
  e.issues.map((i) => ({ path: i.path.map(String).join("."), message: i.message }));

export async function listProjects(): Promise<ProjectRecord[]> {
  const docs = await ProjectModel.find({}).sort({ order: 1, _id: 1 }).lean<ProjectDoc[]>();
  return docs.map(toProject);
}

export async function listCategories(): Promise<CategoryRecord[]> {
  const docs = await CategoryModel.find({}).sort({ order: 1, _id: 1 }).lean<CategoryDoc[]>();
  return docs.map(toCategory);
}

/** Projects and categories in one language, for the public site. */
export async function listPublicProjects(lang: Locale): Promise<Project[]> {
  return (await listProjects()).map((p) => resolveProject(p, lang));
}
export async function listPublicCategories(lang: Locale): Promise<Category[]> {
  return (await listCategories()).map((c) => resolveCategory(c, lang));
}

/**
 * One-off upgrade of projects and categories saved before the site was
 * multilingual: their French texts become { fr }, and the translations of the
 * original projects are added where the French text is still the original one.
 * Safe to run on every start (does nothing once done).
 */
export async function upgradeLegacyProjects(log: (m: string) => void = console.log): Promise<void> {
  const same = (a: unknown, b: LocalizedText) => (typeof a === "string" ? a : asLocalized(a).fr) === b.fr;
  const pick = (stored: unknown, def: LocalizedText | undefined): LocalizedText =>
    typeof stored !== "string" ? asLocalized(stored) : def && same(stored, def) ? def : { fr: stored };

  let n = 0;
  for (const c of await CategoryModel.find({ name: { $type: "string" } }).lean<CategoryDoc[]>()) {
    const def = DEFAULT_CATEGORIES.find((d) => d.slug === c.slug)?.name;
    await CategoryModel.updateOne({ _id: c._id }, { $set: { name: pick(c.name, def) } });
    n++;
  }
  const legacy = await ProjectModel.find({
    $or: [{ title: { $type: "string" } }, { description: { $type: "string" } }, { "cover.alt": { $type: "string" } }, { "images.alt": { $type: "string" } }],
  }).lean<ProjectDoc[]>();
  for (const p of legacy) {
    const def = DEFAULT_PROJECTS.find((d) => d.slug === p.slug);
    const defImgs = def ? [def.cover, ...def.images].filter((d): d is RawImage => d !== null) : [];
    // Only well-formed images are converted; anything else (missing cover, null entry) is left as stored
    // and reported by checkProjectImages, instead of stopping the server.
    const img = (i: unknown) => {
      if (!isImageDoc(i)) return i;
      const alt = typeof i.alt === "string" ? pick(i.alt, defImgs.find((d) => d.src === i.src && same(i.alt, d.alt))?.alt) : asLocalized(i.alt);
      return { ...i, alt };
    };
    await ProjectModel.updateOne(
      { _id: p._id },
      {
        $set: {
          title: pick(p.title, def?.title),
          place: pick(p.place, def?.place),
          typeLabel: pick(p.typeLabel, def?.typeLabel),
          description: pick(p.description, def?.description),
          attribution: pick(p.attribution ?? "", def?.attribution),
          ...(p.cover !== undefined && { cover: img(p.cover) }),
          ...(Array.isArray(p.images) && { images: (p.images as unknown[]).map(img) }),
        },
      },
    );
    n++;
  }
  if (n) log(`Contenu multilingue : ${n} projet(s) / catégorie(s) mis à jour.`);
}

/**
 * Startup report of projects whose stored images cannot be shown (missing cover,
 * empty or invalid image entries). The site still works: the cover falls back to
 * the first image, invalid entries are skipped, and a project without any image
 * shows an empty frame. Opening the project in the dashboard and saving it fixes it.
 */
export async function checkProjectImages(warn: (m: string) => void = console.warn): Promise<string[]> {
  const docs = await ProjectModel.find({}, { slug: 1, cover: 1, images: 1 }).lean<ProjectDoc[]>();
  const problems: string[] = [];
  for (const d of docs) {
    const list = Array.isArray(d.images) ? (d.images as unknown[]) : [];
    const bad = list.filter((i) => !isImageDoc(i)).length;
    const parts: string[] = [];
    if (!isImageDoc(d.cover)) parts.push("image de la carte manquante");
    if (bad) parts.push(`${bad} image(s) invalide(s) ignorée(s)`);
    if (!list.some(isImageDoc)) parts.push("aucune image de projet");
    if (parts.length) problems.push(`« ${d.slug} » : ${parts.join(", ")}`);
  }
  if (problems.length) {
    warn(
      `Attention, ${problems.length} projet(s) ont des images incomplètes dans la base de données (le site reste affiché, ` +
        `ouvrez ces projets dans le tableau de bord pour compléter leurs images) :\n  - ${problems.join("\n  - ")}`,
    );
  }
  return problems;
}

function parseProject(body: unknown) {
  const parsed = projectInputSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Certaines valeurs ne sont pas valides.", issues(parsed.error));
  return parsed.data;
}

async function assertCategory(slug: string) {
  if (!(await CategoryModel.exists({ slug }))) throw badRequest("Catégorie inconnue.", [{ path: "category", message: "Choisissez une catégorie existante." }]);
}

async function assertFreeSlug(slug: string, exceptId?: string) {
  const other = await ProjectModel.findOne({ slug }, { _id: 1 }).lean();
  if (other && String(other._id) !== exceptId) {
    throw conflict("Cette adresse est déjà utilisée par un autre projet.", [{ path: "slug", message: "Adresse déjà utilisée." }]);
  }
}

export async function createProject(body: unknown): Promise<ProjectRecord> {
  const data = parseProject(body);
  await assertCategory(data.category);
  await assertFreeSlug(data.slug);
  const last = await ProjectModel.findOne({}, { order: 1 }).sort({ order: -1 }).lean();
  const doc = await ProjectModel.create({ ...data, order: (last?.order ?? 0) + 1 });
  return toProject(doc.toObject() as ProjectDoc);
}

export async function updateProject(id: string, body: unknown): Promise<ProjectRecord> {
  const data = parseProject(body);
  await assertCategory(data.category);
  await assertFreeSlug(data.slug, id);
  const doc = await ProjectModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean<ProjectDoc>();
  if (!doc) throw notFound("Projet introuvable.");
  return toProject(doc);
}

export async function deleteProject(id: string): Promise<void> {
  const res = await ProjectModel.deleteOne({ _id: id });
  if (!res.deletedCount) throw notFound("Projet introuvable.");
}

async function reorder(model: typeof ProjectModel | typeof CategoryModel, body: unknown) {
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Ordre invalide.", issues(parsed.error));
  const ids = parsed.data.ids;
  const count = await (model as typeof ProjectModel).countDocuments({ _id: { $in: ids } });
  const total = await (model as typeof ProjectModel).estimatedDocumentCount();
  if (count !== ids.length || count !== total || new Set(ids).size !== ids.length) throw badRequest("La liste doit contenir chaque élément une seule fois.");
  await (model as typeof ProjectModel).bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i + 1 } } } })));
}

export const reorderProjects = (body: unknown) => reorder(ProjectModel, body);
export const reorderCategories = (body: unknown) => reorder(CategoryModel, body);

export async function createCategory(body: unknown): Promise<CategoryRecord> {
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Certaines valeurs ne sont pas valides.", issues(parsed.error));
  if (await CategoryModel.exists({ slug: parsed.data.slug })) throw conflict("Cette catégorie existe déjà.", [{ path: "slug", message: "Identifiant déjà utilisé." }]);
  const last = await CategoryModel.findOne({}, { order: 1 }).sort({ order: -1 }).lean();
  const doc = await CategoryModel.create({ ...parsed.data, order: (last?.order ?? 0) + 1 });
  return toCategory(doc.toObject() as CategoryDoc);
}

export async function updateCategory(id: string, body: unknown): Promise<CategoryRecord> {
  const parsed = categoryUpdateSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Certaines valeurs ne sont pas valides.", issues(parsed.error));
  const doc = await CategoryModel.findByIdAndUpdate(id, { $set: parsed.data }, { new: true }).lean<CategoryDoc>();
  if (!doc) throw notFound("Catégorie introuvable.");
  return toCategory(doc);
}

export async function deleteCategory(id: string): Promise<void> {
  const cat = await CategoryModel.findById(id).lean<CategoryDoc>();
  if (!cat) throw notFound("Catégorie introuvable.");
  const used = await ProjectModel.countDocuments({ category: cat.slug });
  if (used) throw conflict(`Cette catégorie contient encore ${used} projet${used > 1 ? "s" : ""}. Déplacez-les avant de la supprimer.`);
  await CategoryModel.deleteOne({ _id: id });
}
