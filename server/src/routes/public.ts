import { Router } from "express";
import { DEFAULT_LOCALE, isLocale, type PublicPayload } from "@rihab/shared";
import { getPublicContent } from "../services/content.js";
import { listPublicCategories, listPublicProjects } from "../services/projects.js";
import { findMedia, openMediaStream } from "../services/media.js";
import { objectIdSchema } from "../services/validation.js";
import { notFound } from "../lib/httpError.js";

export function publicRouter(): Router {
  const r = Router();

  /**
   * Everything the public site needs in one request, in one language (?lang=fr|ar|en).
   * Always revalidated (no-cache + ETag): the browser gets a cheap 304 when nothing
   * changed, and the new content as soon as something is saved in the dashboard.
   */
  r.get("/api/content", async (req, res) => {
    const lang = isLocale(req.query.lang) ? req.query.lang : DEFAULT_LOCALE;
    const [content, projects, categories] = await Promise.all([getPublicContent(lang), listPublicProjects(lang), listPublicCategories(lang)]);
    const payload: PublicPayload = { lang, content, projects, categories };
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
