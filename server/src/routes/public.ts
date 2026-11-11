import { Router } from "express";
import type { PublicPayload } from "@rihab/shared";
import { getContent } from "../services/content.js";
import { listCategories, listProjects } from "../services/projects.js";
import { findMedia, openMediaStream } from "../services/media.js";
import { objectIdSchema } from "../services/validation.js";
import { notFound } from "../lib/httpError.js";

export function publicRouter(): Router {
  const r = Router();

  /** Everything the public site needs in one request. Never cached, so saved changes show at once. */
  r.get("/api/content", async (_req, res) => {
    const [content, projects, categories] = await Promise.all([getContent(), listProjects(), listCategories()]);
    const payload: PublicPayload = { content, projects, categories };
    res.setHeader("Cache-Control", "no-cache");
    res.json(payload);
  });

  r.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  /** Uploaded images, streamed from MongoDB GridFS. A file id never changes content, so it can be cached. */
  r.get("/media/:id", async (req, res) => {
    const id = objectIdSchema.safeParse(req.params.id);
    if (!id.success) throw notFound("Image introuvable.");
    const file = await findMedia(id.data);
    if (!file) throw notFound("Image introuvable.");
    const meta = (file.metadata ?? {}) as { contentType?: string };
    res.setHeader("Content-Type", meta.contentType ?? "application/octet-stream");
    res.setHeader("Content-Length", String(file.length));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    await new Promise<void>((resolve, reject) => {
      openMediaStream(id.data).on("error", reject).on("end", resolve).pipe(res);
    });
  });

  return r;
}
