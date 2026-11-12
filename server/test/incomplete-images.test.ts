/**
 * Projects whose stored images are incomplete (no cover, null or empty image
 * entries), as can happen with data written outside the dashboard or by an
 * older version. Before the fix, the server stopped at startup with
 * "Cannot read properties of undefined (reading 'alt')" and the dev proxy then
 * answered ECONNREFUSED for every /api request.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import mongoose from "mongoose";

const baseUri = process.env.MONGODB_TEST_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/rihab";
const testUri = (process.env.MONGODB_TEST_URI ?? baseUri).replace(/\/([^/?]*)(\?|$)/, (_m, db: string, q: string) => `/${(db || "rihab").replace(/_test$/, "")}_images_test${q}`);
process.env.MONGODB_URI = testUri;
process.env.NODE_ENV = "test";

const { config } = await import("../src/config.js");
const { connectDb, resetMediaBucket } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");
const { ensureAdmin, seedProjects } = await import("../src/services/seed.js");
const { checkProjectImages } = await import("../src/services/projects.js");

const EMAIL = "admin@test.local";
const PASSWORD = "mot-de-passe-solide";
let server: Server;
let base = "";
let cookie = "";
const warnings: string[] = [];

async function call(method: string, p: string, body?: unknown) {
  const h: Record<string, string> = { "X-Requested-With": "XMLHttpRequest" };
  if (cookie) h.Cookie = cookie;
  if (body !== undefined) h["Content-Type"] = "application/json";
  const res = await fetch(base + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null, headers: res.headers };
}

const img = (src: string, alt: string) => ({ src, alt, width: 1200, height: 800 });

before(async () => {
  await connectDb(testUri);
  await mongoose.connection.dropDatabase();
  resetMediaBucket();
  const db = mongoose.connection.db!;
  await db.collection("categories").insertOne({ slug: "residentiel", name: "Résidentiel", order: 1 });
  // French-only texts (older version) and incomplete images.
  await db.collection("projects").insertMany([
    { slug: "sans-couverture", title: "Sans couverture", place: "Tunis", category: "residentiel", typeLabel: "Résidentiel", description: "x", images: [img("/assets/img/curated-comfort-1.svg", "Première image")], order: 1 },
    { slug: "image-nulle", title: "Image nulle", place: "Sousse", category: "residentiel", typeLabel: "Résidentiel", description: "x", cover: img("/assets/img/flavor-street-1.svg", "Couverture"), images: [null, {}, img("/assets/img/curated-comfort-2.svg", "Galerie")], order: 2 },
    { slug: "sans-image", title: "Sans image", place: "Sfax", category: "residentiel", typeLabel: "Résidentiel", description: "x", cover: null, images: [], order: 3 },
  ]);
  const original = console.warn;
  console.warn = (m: string) => void warnings.push(String(m));
  try {
    // Threw "Cannot read properties of undefined (reading 'alt')" before the fix.
    await seedProjects(() => undefined);
  } finally {
    console.warn = original;
  }
  await ensureAdmin(EMAIL, PASSWORD, () => undefined);
  server = createApp(config).listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const login = await call("POST", "/api/auth/login", { email: EMAIL, password: PASSWORD });
  cookie = (login.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
});

after(async () => {
  server?.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("Projets aux images incomplètes", () => {
  it("le démarrage termine la mise à niveau et signale les projets concernés au lieu de s'arrêter", async () => {
    const report = warnings.join("\n");
    assert.match(report, /sans-couverture.*image de la carte manquante/);
    assert.match(report, /image-nulle.*2 image\(s\) invalide\(s\)/);
    assert.match(report, /sans-image.*aucune image de projet/);
    // The French texts were still upgraded to { fr }.
    const doc = await mongoose.connection.db!.collection("projects").findOne({ slug: "image-nulle" });
    assert.deepEqual(doc?.title, { fr: "Image nulle" });
    assert.deepEqual(doc?.cover.alt, { fr: "Couverture" });
    // Incomplete data is reported, not silently rewritten.
    assert.equal(doc?.images.length, 3);
    assert.equal((await checkProjectImages(() => undefined)).length, 3);
  });

  it("/api/content répond dans chaque langue, sans image nulle", async () => {
    for (const lang of ["fr", "en", "ar"]) {
      const { status, json } = await call("GET", `/api/content?lang=${lang}`);
      assert.equal(status, 200, lang);
      const bySlug = Object.fromEntries(json.projects.map((p: any) => [p.slug, p]));
      // Missing cover: the first image takes its place.
      assert.equal(bySlug["sans-couverture"].cover.src, "/assets/img/curated-comfort-1.svg");
      // Null / empty entries are skipped.
      assert.deepEqual(bySlug["image-nulle"].images.map((i: any) => i.src), ["/assets/img/curated-comfort-2.svg"]);
      assert.equal(bySlug["image-nulle"].cover.alt, "Couverture");
      // Nothing to show at all: explicit null (the site draws an empty frame).
      assert.equal(bySlug["sans-image"].cover, null);
      assert.deepEqual(bySlug["sans-image"].images, []);
    }
  });

  it("le tableau de bord liste ces projets, et l'enregistrement exige toujours une image de carte", async () => {
    const list = await call("GET", "/api/admin/projects");
    assert.equal(list.status, 200);
    const p = list.json.find((x: any) => x.slug === "sans-couverture");
    assert.equal(p.cover, null);
    const { id: _id, order: _order, ...input } = p;
    const rejected = await call("PUT", `/api/admin/projects/${p.id}`, input);
    assert.equal(rejected.status, 400);
    const fixed = await call("PUT", `/api/admin/projects/${p.id}`, { ...input, cover: { ...input.images[0] } });
    assert.equal(fixed.status, 200, JSON.stringify(fixed.json));
    assert.equal(fixed.json.cover.src, "/assets/img/curated-comfort-1.svg");
  });
});
