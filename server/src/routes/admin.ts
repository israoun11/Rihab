import { Router } from "express";
import multer from "multer";
import type { AppConfig } from "../config.js";
import { csrfGuard, requireAdmin } from "../middleware/auth.js";
import { getContent, resetSection, updateSection } from "../services/content.js";
import {
  createCategory,
  createProject,
  deleteCategory,
  deleteProject,
  listCategories,
  listProjects,
  reorderCategories,
  reorderProjects,
  updateCategory,
  updateProject,
} from "../services/projects.js";
import { deleteMedia, findUsages, listMedia, storeImage } from "../services/media.js";
import { objectIdSchema } from "../services/validation.js";
import { badRequest, notFound } from "../lib/httpError.js";

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

function idParam(value: unknown): string {
  const parsed = objectIdSchema.safeParse(value);
  if (!parsed.success) throw notFound();
  return parsed.data;
}

export function adminRouter(cfg: AppConfig): Router {
  const r = Router();
  r.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  r.use(requireAdmin);
  r.use(csrfGuard);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: cfg.maxUploadBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (ACCEPTED.has(file.mimetype)) cb(null, true);
      else cb(badRequest("Format non pris en charge. Utilisez une image JPG, PNG, WebP, AVIF ou GIF."));
    },
  });

  /* ---------- Content ---------- */
  r.get("/content", async (_req, res) => {
    res.json(await getContent());
  });
  r.put("/content/:page/:section", async (req, res) => {
    res.json(await updateSection(String(req.params.page), String(req.params.section), req.body));
  });
  r.delete("/content/:page/:section", async (req, res) => {
    res.json(await resetSection(String(req.params.page), String(req.params.section)));
  });

  /* ---------- Projects ---------- */
  r.get("/projects", async (_req, res) => {
    res.json(await listProjects());
  });
  r.post("/projects", async (req, res) => {
    res.status(201).json(await createProject(req.body));
  });
  r.put("/projects/order", async (req, res) => {
    await reorderProjects(req.body);
    res.json(await listProjects());
  });
  r.put("/projects/:id", async (req, res) => {
    res.json(await updateProject(idParam(req.params.id), req.body));
  });
  r.delete("/projects/:id", async (req, res) => {
    await deleteProject(idParam(req.params.id));
    res.status(204).end();
  });

  /* ---------- Categories ---------- */
  r.get("/categories", async (_req, res) => {
    res.json(await listCategories());
  });
  r.post("/categories", async (req, res) => {
    res.status(201).json(await createCategory(req.body));
  });
  r.put("/categories/order", async (req, res) => {
    await reorderCategories(req.body);
    res.json(await listCategories());
  });
  r.put("/categories/:id", async (req, res) => {
    res.json(await updateCategory(idParam(req.params.id), req.body));
  });
  r.delete("/categories/:id", async (req, res) => {
    await deleteCategory(idParam(req.params.id));
    res.status(204).end();
  });

  /* ---------- Media library ---------- */
  r.get("/media", async (_req, res) => {
    res.json(await listMedia());
  });
  r.post("/media", upload.single("file"), async (req, res) => {
    if (!req.file) throw badRequest("Aucun fichier reçu.");
    res.status(201).json(await storeImage(req.file.buffer, req.file.originalname));
  });
  r.get("/media/:id/usages", async (req, res) => {
    res.json({ usages: await findUsages(`/media/${idParam(req.params.id)}`) });
  });
  r.delete("/media/:id", async (req, res) => {
    await deleteMedia(idParam(req.params.id));
    res.status(204).end();
  });

  return r;
}
