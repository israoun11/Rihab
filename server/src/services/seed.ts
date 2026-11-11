import { DEFAULT_CATEGORIES, DEFAULT_PROJECTS } from "@rihab/shared";
import { AdminUser, CategoryModel, ProjectModel } from "../models/index.js";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../lib/password.js";

/** Inserts the original categories and projects when the collections are empty. Safe to run repeatedly. */
export async function seedProjects(log = console.log): Promise<void> {
  if ((await CategoryModel.estimatedDocumentCount()) === 0) {
    await CategoryModel.insertMany(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i + 1 })));
    log(`Catégories initiales créées (${DEFAULT_CATEGORIES.length}).`);
  }
  if ((await ProjectModel.estimatedDocumentCount()) === 0) {
    await ProjectModel.insertMany(DEFAULT_PROJECTS.map((p, i) => ({ ...p, order: i + 1 })));
    log(`Projets initiaux créés (${DEFAULT_PROJECTS.length}).`);
  }
}

/** Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD when none exists. */
export async function ensureAdmin(email: string | undefined, password: string | undefined, log = console.log): Promise<void> {
  if (await AdminUser.exists({})) return;
  if (!email || !password) {
    log("Aucun administrateur : définissez ADMIN_EMAIL et ADMIN_PASSWORD puis redémarrez, ou lancez `npm run create-admin`.");
    return;
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    log(`ADMIN_PASSWORD doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères. Administrateur non créé.`);
    return;
  }
  await AdminUser.create({ email, passwordHash: await hashPassword(password) });
  log(`Administrateur créé : ${email}. Vous pouvez retirer ADMIN_PASSWORD du fichier .env.`);
}
