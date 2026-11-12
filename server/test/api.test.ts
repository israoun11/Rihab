/**
 * API integration tests against a real MongoDB.
 * Uses MONGODB_TEST_URI, or MONGODB_URI with a database name suffixed "_test".
 * The test database is dropped before and after the run.
 *   npm test
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import mongoose from "mongoose";

const baseUri = process.env.MONGODB_TEST_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/rihab";
const testUri = process.env.MONGODB_TEST_URI ?? baseUri.replace(/\/([^/?]*)(\?|$)/, (_m, db: string, q: string) => `/${db || "rihab"}_test${q}`);
process.env.MONGODB_URI = testUri;
process.env.NODE_ENV = "test";
process.env.LOGIN_MAX_ATTEMPTS = "5";

const { config } = await import("../src/config.js");
const { connectDb, resetMediaBucket } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");
const { ensureAdmin, seedProjects } = await import("../src/services/seed.js");

const EMAIL = "admin@test.local";
const PASSWORD = "mot-de-passe-solide";
// 2×3 px PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAEElEQVR4nGP4z8AARAwoFABE0AX7pM/egAAAAABJRU5ErkJggg==",
  "base64",
);

let server: Server;
let base = "";
let cookie = "";

const H = { "X-Requested-With": "XMLHttpRequest" };

async function call(method: string, path: string, body?: unknown, opts: { auth?: boolean; csrf?: boolean } = {}) {
  const headers: Record<string, string> = {};
  if (opts.csrf !== false) Object.assign(headers, H);
  if (opts.auth !== false && cookie) headers.Cookie = cookie;
  let payload: FormData | string | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(base + path, { method, headers, body: payload, redirect: "manual" });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json: json as any, headers: res.headers };
}

before(async () => {
  await connectDb(testUri);
  await mongoose.connection.dropDatabase();
  resetMediaBucket();
  await seedProjects(() => undefined);
  await ensureAdmin(EMAIL, PASSWORD, () => undefined);
  server = createApp(config).listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  server?.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("Site public", () => {
  it("renvoie le contenu complet par défaut, les projets et les catégories", async () => {
    const r = await call("GET", "/api/content");
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("cache-control"), "no-cache");
    assert.equal(r.json.content.home.hero.title, "L’espace prend forme.\n*Votre histoire aussi.*");
    assert.equal(r.json.content.site.nav.services, "Services");
    assert.equal(r.json.projects.length, 5);
    assert.equal(r.json.projects[0].slug, "curated-comfort");
    assert.deepEqual(
      r.json.categories.map((c: { slug: string }) => c.slug),
      ["residentiel", "commercial"],
    );
  });

  it("redirige les anciennes adresses .html", async () => {
    const a = await call("GET", "/projets.html");
    assert.equal(a.status, 301);
    assert.equal(a.headers.get("location"), "/projets");
    const b = await call("GET", "/projet-curated-comfort.html");
    assert.equal(b.headers.get("location"), "/projets/curated-comfort");
  });

  it("répond 404 en JSON sur une route d’API inconnue", async () => {
    const r = await call("GET", "/api/inconnu");
    assert.equal(r.status, 404);
    assert.ok(r.json.error);
  });
});

describe("Authentification", () => {
  it("refuse l’accès à l’administration sans session", async () => {
    const r = await call("GET", "/api/admin/content", undefined, { auth: false });
    assert.equal(r.status, 401);
  });

  it("refuse une connexion sans en-tête anti-CSRF", async () => {
    const r = await call("POST", "/api/auth/login", { email: EMAIL, password: PASSWORD }, { csrf: false });
    assert.equal(r.status, 403);
  });

  it("refuse un mauvais mot de passe", async () => {
    const r = await call("POST", "/api/auth/login", { email: EMAIL, password: "faux" });
    assert.equal(r.status, 401);
    assert.match(r.json.error, /incorrect/);
  });

  it("connecte l’administrateur avec un cookie HttpOnly SameSite=Strict", async () => {
    const r = await call("POST", "/api/auth/login", { email: EMAIL.toUpperCase(), password: PASSWORD });
    assert.equal(r.status, 200);
    const set = r.headers.get("set-cookie") ?? "";
    assert.match(set, /rb_session=/);
    assert.match(set, /HttpOnly/i);
    assert.match(set, /SameSite=Strict/i);
    cookie = set.split(";")[0] ?? "";
    const me = await call("GET", "/api/auth/me");
    assert.equal(me.json.email, EMAIL);
  });
});

describe("Contenu", () => {
  it("enregistre une section et la publie immédiatement", async () => {
    const current = (await call("GET", "/api/admin/content")).json.home.hero;
    const r = await call("PUT", "/api/admin/content/home/hero", { ...current, label: "Nouveau surtitre" });
    assert.equal(r.status, 200);
    const pub = await call("GET", "/api/content");
    assert.equal(pub.json.content.home.hero.label, "Nouveau surtitre");
  });

  it("refuse une modification sans en-tête anti-CSRF", async () => {
    const current = (await call("GET", "/api/admin/content")).json.site.nav;
    const r = await call("PUT", "/api/admin/content/site/nav", current, { csrf: false });
    assert.equal(r.status, 403);
  });

  it("valide les données : texte vide, champ inconnu, image externe", async () => {
    const hero = (await call("GET", "/api/admin/content")).json.home.hero;
    const empty = await call("PUT", "/api/admin/content/home/hero", { ...hero, title: "  " });
    assert.equal(empty.status, 400);
    assert.ok(empty.json.details.some((d: { path: string }) => d.path.startsWith("title")));
    const extra = await call("PUT", "/api/admin/content/home/hero", { ...hero, pirate: "x" });
    assert.equal(extra.status, 400);
    const ext = await call("PUT", "/api/admin/content/home/hero", { ...hero, image: { ...hero.image, src: "https://evil.example/x.png" } });
    assert.equal(ext.status, 400);
    const unknown = await call("PUT", "/api/admin/content/home/inconnue", {});
    assert.equal(unknown.status, 404);
  });

  it("valide les listes (réseaux sociaux) et les adresses", async () => {
    const bad = await call("PUT", "/api/admin/content/site/social", { links: [{ label: "X", url: "javascript:alert(1)" }] });
    assert.equal(bad.status, 400);
    const ok = await call("PUT", "/api/admin/content/site/social", { links: [{ label: "Instagram", url: "https://instagram.com/rihab" }] });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.site.social.links.length, 1);
  });

  it("ajoute une image facultative puis rétablit la section d’origine (sans image)", async () => {
    const about = (await call("GET", "/api/admin/content")).json.home.about;
    assert.equal(about.detailImage, null);
    const img = { src: "/assets/img/detail-materiaux.svg", alt: "Détail", width: 1200, height: 1500 };
    const r = await call("PUT", "/api/admin/content/home/about", { ...about, detailImage: img });
    assert.equal(r.json.home.about.detailImage.src, img.src);
    const reset = await call("DELETE", "/api/admin/content/home/about");
    assert.equal(reset.json.home.about.detailImage, null);
  });
});

describe("Images", () => {
  let mediaId = "";

  it("importe une image et la sert depuis MongoDB", async () => {
    const fd = new FormData();
    fd.append("file", new Blob([PNG], { type: "image/png" }), "essai.png");
    const r = await call("POST", "/api/admin/media", fd);
    assert.equal(r.status, 201);
    assert.equal(r.json.width, 2);
    assert.equal(r.json.height, 3);
    mediaId = r.json.id;
    const res = await fetch(`${base}/media/${mediaId}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "image/png");
    assert.equal(Buffer.from(await res.arrayBuffer()).length, PNG.length);
  });

  it("refuse un fichier qui n’est pas une image", async () => {
    const fd = new FormData();
    fd.append("file", new Blob(["<svg onload=alert(1)>"], { type: "image/png" }), "faux.png");
    const r = await call("POST", "/api/admin/media", fd);
    assert.equal(r.status, 400);
  });

  it("remplace une image du site puis empêche de supprimer une image utilisée", async () => {
    const hero = (await call("GET", "/api/admin/content")).json.home.hero;
    const r = await call("PUT", "/api/admin/content/home/hero", { ...hero, image: { src: `/media/${mediaId}`, alt: "", width: 2, height: 3 } });
    assert.equal(r.status, 200);
    const pub = await call("GET", "/api/content");
    assert.equal(pub.json.content.home.hero.image.src, `/media/${mediaId}`);
    const del = await call("DELETE", `/api/admin/media/${mediaId}`);
    assert.equal(del.status, 409);
    assert.ok(del.json.details.usages.length >= 1);
  });

  it("supprime l’image une fois qu’elle n’est plus utilisée", async () => {
    await call("DELETE", "/api/admin/content/home/hero");
    const del = await call("DELETE", `/api/admin/media/${mediaId}`);
    assert.equal(del.status, 204);
    const res = await fetch(`${base}/media/${mediaId}`);
    assert.equal(res.status, 404);
  });
});

describe("Projets et catégories", () => {
  let projectId = "";
  const img = { src: "/assets/img/hero.svg", alt: "Vue", width: 1920, height: 1080 };

  it("crée, modifie et supprime un projet", async () => {
    const created = await call("POST", "/api/admin/projects", {
      slug: "villa-test",
      title: "Villa Test",
      place: "Djerba",
      category: "residentiel",
      typeLabel: "Villa",
      description: "Un projet de test.",
      attribution: "",
      cover: img,
      images: [img],
    });
    assert.equal(created.status, 201);
    projectId = created.json.id;
    const withIds = await call("POST", "/api/admin/projects", { ...created.json, slug: "autre" });
    assert.equal(withIds.status, 400); // id and order are not accepted input fields
    const updated = await call("PUT", `/api/admin/projects/${projectId}`, {
      slug: "villa-test",
      title: "Villa Test 2",
      place: "Djerba",
      category: "commercial",
      typeLabel: "Villa",
      description: "Un projet de test.",
      attribution: "",
      cover: img,
      images: [img, { ...img, src: "/assets/img/detail-materiaux.svg", width: 1200, height: 1500 }],
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.json.images.length, 2);
    const pub = await call("GET", "/api/content");
    assert.ok(pub.json.projects.some((p: { title: string }) => p.title === "Villa Test 2"));
  });

  it("refuse une adresse déjà utilisée et une catégorie inconnue", async () => {
    const base = { title: "X", place: "Y", typeLabel: "Z", description: "D", attribution: "", cover: img, images: [img] };
    const taken = await call("POST", "/api/admin/projects", { ...base, slug: "curated-comfort", category: "residentiel" });
    assert.equal(taken.status, 409);
    const cat = await call("POST", "/api/admin/projects", { ...base, slug: "nouveau", category: "inexistante" });
    assert.equal(cat.status, 400);
  });

  it("réordonne les projets", async () => {
    const list = (await call("GET", "/api/admin/projects")).json as { id: string }[];
    const ids = list.map((p) => p.id).reverse();
    const r = await call("PUT", "/api/admin/projects/order", { ids });
    assert.equal(r.status, 200);
    assert.deepEqual(
      r.json.map((p: { id: string }) => p.id),
      ids,
    );
  });

  it("protège une catégorie qui contient des projets", async () => {
    const cats = (await call("GET", "/api/admin/categories")).json as { id: string; slug: string }[];
    const commercial = cats.find((c) => c.slug === "commercial");
    const r = await call("DELETE", `/api/admin/categories/${commercial?.id}`);
    assert.equal(r.status, 409);
    const created = await call("POST", "/api/admin/categories", { slug: "bureaux", name: "Bureaux" });
    assert.equal(created.status, 201);
    const renamed = await call("PUT", `/api/admin/categories/${created.json.id}`, { name: "Bureaux & ateliers" });
    assert.deepEqual(renamed.json.name, { fr: "Bureaux & ateliers" });
    const del = await call("DELETE", `/api/admin/categories/${created.json.id}`);
    assert.equal(del.status, 204);
  });

  it("supprime le projet de test", async () => {
    const r = await call("DELETE", `/api/admin/projects/${projectId}`);
    assert.equal(r.status, 204);
  });
});

describe("Déconnexion et limite de tentatives", () => {
  it("ferme la session", async () => {
    const r = await call("POST", "/api/auth/logout");
    assert.equal(r.status, 204);
    const me = await call("GET", "/api/admin/content");
    assert.equal(me.status, 401);
  });

  it("bloque après trop de tentatives", async () => {
    let last = 0;
    for (let i = 0; i < 7; i++) last = (await call("POST", "/api/auth/login", { email: EMAIL, password: "faux" + i }, { auth: false })).status;
    assert.equal(last, 429);
  });
});
