/**
 * Creates an administrator, or resets the password of an existing one.
 * Usage: npm run create-admin -- <email> <mot-de-passe>
 * (or set ADMIN_EMAIL / ADMIN_PASSWORD in .env and run without arguments)
 */
import { z } from "zod";
import { config } from "../config.js";
import { connectDb, disconnectDb } from "../db.js";
import { AdminUser, SessionModel } from "../models/index.js";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../lib/password.js";

const [argEmail, argPassword] = process.argv.slice(2);
const email = (argEmail ?? config.adminEmail ?? "").trim().toLowerCase();
const password = argPassword ?? config.adminPassword ?? "";

if (!z.email().safeParse(email).success) {
  console.error("Indiquez une adresse e-mail valide : npm run create-admin -- email@exemple.com MotDePasse");
  process.exit(1);
}
if (password.length < PASSWORD_MIN_LENGTH) {
  console.error(`Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`);
  process.exit(1);
}

await connectDb(config.mongoUri);
const passwordHash = await hashPassword(password);
const existing = await AdminUser.findOne({ email });
if (existing) {
  existing.passwordHash = passwordHash;
  await existing.save();
  await SessionModel.deleteMany({ userId: existing._id });
  console.log(`Mot de passe mis à jour pour ${email}. Les sessions ouvertes ont été fermées.`);
} else {
  await AdminUser.create({ email, passwordHash });
  console.log(`Administrateur créé : ${email}`);
}
await disconnectDb();
