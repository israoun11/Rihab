import { config } from "./config.js";
import { connectDb, disconnectDb } from "./db.js";
import { createApp } from "./app.js";
import { ensureAdmin, seedProjects } from "./services/seed.js";

async function main() {
  await connectDb(config.mongoUri);
  await seedProjects();
  await ensureAdmin(config.adminEmail, config.adminPassword);

  const app = createApp(config);
  const server = app.listen(config.port, () => {
    console.log(`Serveur prêt sur http://localhost:${config.port} (${config.env})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} reçu, arrêt en cours…`);
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Démarrage impossible :", err instanceof Error ? err.message : err);
  process.exit(1);
});
