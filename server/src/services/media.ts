import { Readable } from "node:stream";
import mongoose from "mongoose";
import { imageSize } from "image-size";
import { mediaBucket } from "../db.js";
import { CONTENT_SCHEMA, pickText, type PageDef } from "@rihab/shared";
import { getContent } from "./content.js";
import { ProjectModel } from "../models/index.js";
import { badRequest, conflict, notFound } from "../lib/httpError.js";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
  uploadedAt: string;
}

interface MediaMeta {
  contentType: string;
  width: number;
  height: number;
  originalName: string;
}

const toItem = (f: { _id: mongoose.Types.ObjectId; length: number; uploadDate: Date; metadata?: unknown }): MediaItem => {
  const m = (f.metadata ?? {}) as Partial<MediaMeta>;
  const id = String(f._id);
  return {
    id,
    url: `/media/${id}`,
    filename: m.originalName ?? id,
    contentType: m.contentType ?? "application/octet-stream",
    size: f.length,
    width: m.width ?? 0,
    height: m.height ?? 0,
    uploadedAt: f.uploadDate.toISOString(),
  };
};

/** Checks the real file content (not the declared type) and stores it in GridFS. */
export async function storeImage(buffer: Buffer, originalName: string): Promise<MediaItem> {
  let info: { width?: number; height?: number; type?: string };
  try {
    info = imageSize(buffer);
  } catch {
    throw badRequest("Ce fichier n’est pas une image lisible.");
  }
  const type = info.type === "heif" ? "avif" : info.type;
  const contentType = type ? TYPES[type] : undefined;
  if (!contentType || !info.width || !info.height) {
    throw badRequest("Format non pris en charge. Utilisez une image JPG, PNG, WebP, AVIF ou GIF.");
  }
  const safeName = originalName.replace(/[^\w.\- ()À-ÿ]/g, "_").slice(0, 120) || "image";
  const meta: MediaMeta = { contentType, width: info.width, height: info.height, originalName: safeName };
  const upload = mediaBucket().openUploadStream(safeName, { metadata: meta });
  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer).pipe(upload).on("finish", () => resolve()).on("error", reject);
  });
  return toItem({ _id: upload.id as mongoose.Types.ObjectId, length: buffer.length, uploadDate: new Date(), metadata: meta });
}

export async function listMedia(): Promise<MediaItem[]> {
  const files = await mediaBucket().find({}, { sort: { uploadDate: -1 } }).toArray();
  return files.map((f) => toItem({ _id: f._id as mongoose.Types.ObjectId, length: f.length, uploadDate: f.uploadDate, metadata: f.metadata }));
}

export async function findMedia(id: string) {
  const files = await mediaBucket().find({ _id: new mongoose.Types.ObjectId(id) }).limit(1).toArray();
  return files[0] ?? null;
}

export function openMediaStream(id: string) {
  return mediaBucket().openDownloadStream(new mongoose.Types.ObjectId(id));
}

/** Places on the site that use the given media url, in plain French. */
export async function findUsages(url: string): Promise<string[]> {
  const usages: string[] = [];
  const content = await getContent();
  const walk = (value: unknown, where: string) => {
    if (typeof value === "string") {
      if (value === url) usages.push(where);
    } else if (Array.isArray(value)) value.forEach((v) => walk(v, where));
    else if (value && typeof value === "object") for (const v of Object.values(value)) walk(v, where);
  };
  for (const [page, sections] of Object.entries(content)) {
    const pageDef = (CONTENT_SCHEMA as Record<string, PageDef>)[page];
    for (const [section, data] of Object.entries(sections as Record<string, unknown>)) {
      walk(data, `${pageDef?.label ?? page} › ${pageDef?.sections[section]?.label ?? section}`);
    }
  }
  const projects = await ProjectModel.find({ $or: [{ "cover.src": url }, { "images.src": url }] }, { title: 1 }).lean();
  for (const p of projects) usages.push(`Projet « ${pickText(p.title, "fr")} »`);
  return [...new Set(usages)];
}

export async function deleteMedia(id: string): Promise<void> {
  const file = await findMedia(id);
  if (!file) throw notFound("Image introuvable.");
  const usages = await findUsages(`/media/${id}`);
  if (usages.length) {
    throw conflict("Cette image est encore utilisée sur le site. Remplacez-la d’abord aux endroits indiqués.", { usages });
  }
  await mediaBucket().delete(file._id);
}
