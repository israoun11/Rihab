import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ServerResponse } from "node:http";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Same .env files as the API server (repository root, then server/), so a PORT
  // changed there is also the port the dev proxy forwards /api and /media to.
  const env = {
    ...loadEnv(mode, path.resolve(here, ".."), ""),
    ...loadEnv(mode, path.resolve(here, "../server"), ""),
    ...process.env,
  };
  const api = env.API_URL || `http://localhost:${env.PORT || 4000}`;

  const proxy: ProxyOptions = {
    target: api,
    changeOrigin: false,
    configure: (p) => {
      // The API is not running (stopped at startup, or another port): answer with an
      // explicit 503 instead of an empty 500, and say where to look.
      p.on("error", (err, req, res) => {
        const code = (err as NodeJS.ErrnoException).code ?? err.message;
        console.error(
          `[proxy] ${req.url} → ${api} : ${code}. Le serveur de l’API ne répond pas : ` +
            `regardez plus haut dans ce terminal la raison de son arrêt (ex. « Configuration invalide » ou « Démarrage impossible »).`,
        );
        const out = res as ServerResponse;
        if (out && !out.headersSent && typeof out.writeHead === "function") {
          out.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
          out.end(JSON.stringify({ error: `API injoignable sur ${api} (${code}).` }));
        }
      });
    },
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { "/api": proxy, "/media": { ...proxy } },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
