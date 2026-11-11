/** Inserts the original categories and projects if the database is empty. */
import { config } from "../config.js";
import { connectDb, disconnectDb } from "../db.js";
import { seedProjects } from "../services/seed.js";

await connectDb(config.mongoUri);
await seedProjects();
console.log("Données initiales vérifiées. Les textes des pages proviennent du contenu par défaut tant qu’ils ne sont pas modifiés.");
await disconnectDb();
