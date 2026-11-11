import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HttpError } from "../lib/httpError.js";

export function notFoundApi(_req: Request, res: Response): void {
  res.status(404).json({ error: "Ressource introuvable." });
}

// Express recognises error handlers by their four arguments.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...(err.details !== undefined ? { details: err.details } : {}) });
    return;
  }
  if (err instanceof multer.MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux." : "Envoi du fichier impossible.";
    res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: msg });
    return;
  }
  const e = err as { type?: string; status?: number };
  if (e?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Données JSON invalides." });
    return;
  }
  if (e?.type === "entity.too.large") {
    res.status(413).json({ error: "Données trop volumineuses." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Une erreur inattendue est survenue. Réessayez dans un instant." });
}
