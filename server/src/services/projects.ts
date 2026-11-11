import type { Category, Project } from "@rihab/shared";
import { CategoryModel, ProjectModel, type CategoryDoc, type ProjectDoc } from "../models/index.js";
import { badRequest, conflict, notFound } from "../lib/httpError.js";
import { categoryInputSchema, categoryUpdateSchema, orderSchema, projectInputSchema } from "./validation.js";

type Img = Project["images"][number];
const toImage = (i: { src: string; alt?: string | null; width: number; height: number; srcSet?: string | null; demo?: boolean | null }): Img => {
  const img: Img = { src: i.src, alt: i.alt ?? "", width: i.width, height: i.height };
  if (i.srcSet) img.srcSet = i.srcSet;
  if (i.demo) img.demo = true;
  return img;
};

export const toProject = (d: ProjectDoc): Project => ({
  id: String(d._id),
  slug: d.slug,
  title: d.title,
  place: d.place,
  category: d.category,
  typeLabel: d.typeLabel,
  description: d.description,
  attribution: d.attribution ?? "",
  cover: toImage(d.cover as unknown as Img),
  images: (d.images as unknown as Img[]).map(toImage),
  order: d.order ?? 0,
});

export const toCategory = (d: CategoryDoc): Category => ({
  id: String(d._id),
  slug: d.slug,
  name: d.name,
  order: d.order ?? 0,
});

const issues = (e: { issues: { path: PropertyKey[]; message: string }[] }) =>
  e.issues.map((i) => ({ path: i.path.map(String).join("."), message: i.message }));

export async function listProjects(): Promise<Project[]> {
  const docs = await ProjectModel.find({}).sort({ order: 1, _id: 1 }).lean<ProjectDoc[]>();
  return docs.map(toProject);
}

export async function listCategories(): Promise<Category[]> {
  const docs = await CategoryModel.find({}).sort({ order: 1, _id: 1 }).lean<CategoryDoc[]>();
  return docs.map(toCategory);
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

export async function createProject(body: unknown): Promise<Project> {
  const data = parseProject(body);
  await assertCategory(data.category);
  await assertFreeSlug(data.slug);
  const last = await ProjectModel.findOne({}, { order: 1 }).sort({ order: -1 }).lean();
  const doc = await ProjectModel.create({ ...data, order: (last?.order ?? 0) + 1 });
  return toProject(doc.toObject() as ProjectDoc);
}

export async function updateProject(id: string, body: unknown): Promise<Project> {
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

export async function createCategory(body: unknown): Promise<Category> {
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Certaines valeurs ne sont pas valides.", issues(parsed.error));
  if (await CategoryModel.exists({ slug: parsed.data.slug })) throw conflict("Cette catégorie existe déjà.", [{ path: "slug", message: "Identifiant déjà utilisé." }]);
  const last = await CategoryModel.findOne({}, { order: 1 }).sort({ order: -1 }).lean();
  const doc = await CategoryModel.create({ ...parsed.data, order: (last?.order ?? 0) + 1 });
  return toCategory(doc.toObject() as CategoryDoc);
}

export async function updateCategory(id: string, body: unknown): Promise<Category> {
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
