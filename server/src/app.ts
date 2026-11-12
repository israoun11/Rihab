import fs from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import type { AppConfig } from "./config.js";
import { publicRouter } from "./routes/public.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { errorHandler, notFoundApi } from "./middleware/errors.js";
import { pageMeta, renderIndex } from "./services/seo.js";

/** Addresses of the former static site, kept working with permanent redirects. */
const LEGACY: Record<string, string> = {
  "/index.html": "/",
  "/a-propos.html": "/a-propos",
  "/projets.html": "/projets",
  "/services.html": "/services",
  "/formations.html": "/formations",
  "/contact.html": "/contact",
};

export function createApp(cfg: AppConfig): Express {
  const app = express();
  app.disable("x-powered-by");
  if (cfg.trustProxy) app.set("trust proxy", /^\d+$/.test(cfg.trustProxy) ? Number(cfg.trustProxy) : cfg.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: cfg.cookieSecure ? [] : null,
        },
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Legacy .html addresses
  app.get(/^\/[\w-]+\.html$/, (req, res, next) => {
    const target = LEGACY[req.path] ?? (/^\/projet-([a-z0-9-]+)\.html$/.exec(req.path)?.[1] ? `/projets/${/^\/projet-([a-z0-9-]+)\.html$/.exec(req.path)?.[1]}` : undefined);
    if (target) res.redirect(301, target);
    else next();
  });

  app.use(publicRouter());
  app.use("/api/auth", authRouter(cfg));
  app.use("/api/admin", adminRouter(cfg));
  app.use("/api", notFoundApi);

  // Built React app (production). In development, Vite serves the client and proxies /api and /media here.
  const indexHtml = path.join(cfg.clientDist, "index.html");
  if (fs.existsSync(indexHtml)) {
    app.use(
      express.static(cfg.clientDist, {
        index: false,
        setHeaders: (res, file) => {
          const hashed = /[\\/]assets[\\/][^\\/]+-[\w-]{8,}\.(?:js|css)$/.test(file);
          res.setHeader("Cache-Control", hashed ? "public, max-age=31536000, immutable" : "public, max-age=3600");
        },
      }),
    );
    const template = fs.readFileSync(indexHtml, "utf8");
    // Every page: index.html with the language, direction, title, description and
    // social tags of that page, taken from the saved content (good for search engines
    // and link previews), and a real 404 status for unknown addresses.
    app.get(/^\/(?!api\/|media\/).*/, async (req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.type("html");
      if (req.path.startsWith("/admin")) {
        res.send(template.replace("<head>", '<head>\n<meta name="robots" content="noindex, nofollow">'));
        return;
      }
      try {
        const { meta, content } = await pageMeta(req.path);
        res.status(meta.status).send(renderIndex(template, meta, content, `${req.protocol}://${req.get("host") ?? "localhost"}`));
      } catch (err) {
        console.error("Métadonnées de page indisponibles :", err);
        res.send(template);
      }
    });
  } else {
    app.get("/", (_req, res) => {
      res.type("text").send("API en ligne. Lancez le client (npm run dev) ou construisez-le (npm run build).");
    });
  }

  app.use(errorHandler);
  return app;
}
