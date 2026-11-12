/**
 * Multilingual content (FR / AR / EN), dashboard → site synchronisation,
 * section layout, design settings, upgrade of data saved by the previous
 * (French-only) version, and the HTML served for each page (SEO).
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import mongoose from "mongoose";

const baseUri = process.env.MONGODB_TEST_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/rihab";
const testUri = (process.env.MONGODB_TEST_URI ?? baseUri).replace(/\/([^/?]*)(\?|$)/, (_m, db: string, q: string) => `/${(db || "rihab").replace(/_test$/, "")}_i18n_test${q}`);
process.env.MONGODB_URI = testUri;
process.env.NODE_ENV = "test";
// A minimal built client, so the server renders pages (title, language, social tags).
const dist = fs.mkdtempSync(path.join(os.tmpdir(), "rihab-dist-"));
fs.writeFileSync(
  path.join(dist, "index.html"),
  '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<title>Rihab Baabou</title>\n<meta name="description" content="x">\n</head>\n<body><div id="root"></div></body>\n</html>\n',
);
process.env.CLIENT_DIST = dist;

const { config } = await import("../src/config.js");
const { connectDb, resetMediaBucket } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");
const { ensureAdmin, seedProjects } = await import("../src/services/seed.js");

const EMAIL = "admin@test.local";
const PASSWORD = "mot-de-passe-solide";
let server: Server;
let base = "";
let cookie = "";

async function call(method: string, p: string, body?: unknown, headers: Record<string, string> = {}) {
  const h: Record<string, string> = { "X-Requested-With": "XMLHttpRequest", ...headers };
  if (cookie) h.Cookie = cookie;
  let payload: string | undefined;
  if (body !== undefined) {
    h["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(base + p, { method, headers: h, body: payload, redirect: "manual" });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json, text, headers: res.headers };
}
/** Conditional request as a browser revalidating its copy (fetch() would add "Cache-Control: no-cache"). */
const again = (etag: string) =>
  new Promise<number>((resolve, reject) => {
    http.get(`${base}/api/content?lang=en`, { headers: { "If-None-Match": etag } }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    }).on("error", reject);
  });
const pub = async (lang?: string) => (await call("GET", `/api/content${lang ? `?lang=${lang}` : ""}`)).json;
const admin = async () => (await call("GET", "/api/admin/content")).json;

before(async () => {
  await connectDb(testUri);
  await mongoose.connection.dropDatabase();
  resetMediaBucket();
  const db = mongoose.connection.db!;
  // Data as saved by the previous, French-only version of the site.
  await db.collection("categories").insertMany([
    { slug: "residentiel", name: "Résidentiel", order: 1 },
    { slug: "commercial", name: "Commerces", order: 2 },
  ]);
  await db.collection("projects").insertOne({
    slug: "curated-comfort",
    title: "Curated Comfort",
    place: "Sousse",
    category: "residentiel",
    typeLabel: "Résidentiel",
    description: "Description réécrite par la propriétaire.",
    attribution: "",
    cover: { src: "/assets/img/curated-comfort-1.svg", alt: "Vue d’ensemble du salon ouvert sur la cuisine", width: 1920, height: 1080 },
    images: [{ src: "/assets/img/curated-comfort-1.svg", alt: "Vue d’ensemble du salon ouvert sur la cuisine", width: 1920, height: 1080 }],
    order: 1,
  });
  await db.collection("content").insertOne({
    _id: "home" as unknown as mongoose.Types.ObjectId,
    data: {
      hero: { label: "Surtitre personnalisé", title: "L’espace prend forme.\n*Votre histoire aussi.*" },
      projects: { meta: "ancien champ supprimé", interval: "8" },
    },
  });
  await seedProjects(() => undefined);
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
  fs.rmSync(dist, { recursive: true, force: true });
});

describe("Mise à niveau des données de la version précédente", () => {
  it("garde les textes modifiés et traduit les textes d’origine", async () => {
    const ar = await pub("ar");
    assert.equal(ar.content.home.hero.label, "Surtitre personnalisé"); // edited text: French until translated
    assert.equal(ar.content.home.hero.title, "الفضاء يتشكّل.\n*وقصّتك أيضًا.*"); // untouched text: translated
    assert.equal(ar.content.home.projects.interval, "8");
    assert.equal(ar.content.home.projects.meta, undefined); // removed field
    const raw = await admin();
    assert.deepEqual(raw.home.hero.label, { fr: "Surtitre personnalisé" });
  });

  it("convertit projets et catégories, en réutilisant les traductions d’origine", async () => {
    const en = await pub("en");
    const p = en.projects.find((x: { slug: string }) => x.slug === "curated-comfort");
    assert.equal(p.place, "Sousse");
    assert.equal(p.typeLabel, "Residential");
    assert.equal(p.description, "Description réécrite par la propriétaire.");
    assert.equal(p.cover.alt, "Overall view of the living room open to the kitchen");
    assert.deepEqual(
      en.categories.map((c: { name: string }) => c.name),
      ["Residential", "Commerces"],
    );
    const projects = (await call("GET", "/api/admin/projects")).json;
    assert.deepEqual(projects[0].title, { fr: "Curated Comfort", ar: "Curated Comfort", en: "Curated Comfort" });
  });
});

describe("API publique par langue", () => {
  it("renvoie le contenu dans la langue demandée, en français par défaut", async () => {
    const [fr, ar, en, bad] = await Promise.all([pub(), pub("ar"), pub("en"), pub("de")]);
    assert.equal(fr.lang, "fr");
    assert.equal(fr.content.site.nav.home, "Accueil");
    assert.equal(ar.content.site.nav.home, "الرئيسية");
    assert.equal(en.content.site.nav.home, "Home");
    assert.equal(bad.lang, "fr");
    assert.equal(en.content.contact.errors.emailMissing, "Enter your e-mail address.");
    assert.equal(ar.content.site.contact.email, fr.content.site.contact.email);
  });

  it("revalide sans cache : 304 tant que rien ne change, nouveau contenu dès l’enregistrement", async () => {
    const first = await call("GET", "/api/content?lang=en");
    assert.equal(first.headers.get("cache-control"), "no-cache");
    const etag = first.headers.get("etag") ?? "";
    assert.ok(etag);
    assert.equal(await again(etag), 304);
    const raw = await admin();
    await call("PUT", "/api/admin/content/site/footer", { ...raw.site.footer, text: { ...raw.site.footer.text, en: "Updated footer." } });
    assert.equal(await again(etag), 200);
    assert.equal((await pub("en")).content.site.footer.text, "Updated footer.");
  });
});

describe("Traductions gérées dans le tableau de bord", () => {
  it("enregistre les trois langues d’un texte et retombe sur le français si une traduction est vide", async () => {
    const raw = await admin();
    const r = await call("PUT", "/api/admin/content/about/head", {
      ...raw.about.head,
      label: { fr: "Portrait", ar: "نبذة", en: "  " },
    });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.about.head.label, { fr: "Portrait", ar: "نبذة" }); // empty translation not stored
    assert.equal((await pub("ar")).content.about.head.label, "نبذة");
    assert.equal((await pub("en")).content.about.head.label, "Portrait");
  });

  it("exige le français pour un texte obligatoire, mais pas les traductions", async () => {
    const raw = await admin();
    const r = await call("PUT", "/api/admin/content/about/head", { ...raw.about.head, title: { fr: "", ar: "عنوان", en: "Title" } });
    assert.equal(r.status, 400);
    assert.ok(r.json.details.some((d: { path: string }) => d.path === "title.fr"));
  });

  it("traduit les listes : un élément ajouté existe dans toutes les langues, supprimé il disparaît partout", async () => {
    const raw = await admin();
    const items = [...raw.services.audiences.items, { title: { fr: "Écoles", en: "Schools" }, text: { fr: "Ateliers et salles de classe." } }];
    await call("PUT", "/api/admin/content/services/audiences", { ...raw.services.audiences, items });
    const [fr, ar, en] = await Promise.all([pub("fr"), pub("ar"), pub("en")]);
    assert.equal(fr.content.services.audiences.items.length, 4);
    assert.equal(en.content.services.audiences.items[3].title, "Schools");
    assert.equal(ar.content.services.audiences.items[3].title, "Écoles"); // not translated yet: French
    assert.equal(ar.content.services.audiences.items[0].title, "الأفراد");
    await call("PUT", "/api/admin/content/services/audiences", { ...raw.services.audiences });
    assert.equal((await pub("ar")).content.services.audiences.items.length, 3);
  });

  it("traduit les listes de mots par langue (types de projet du formulaire)", async () => {
    const raw = await admin();
    assert.deepEqual(raw.contact.form.typeOptions.en, ["Residential", "Commercial", "Training", "Other"]);
    const r = await call("PUT", "/api/admin/content/contact/form", {
      ...raw.contact.form,
      typeOptions: { ...raw.contact.form.typeOptions, en: ["Home", "Shop"] },
    });
    assert.equal(r.status, 200);
    assert.deepEqual((await pub("en")).content.contact.form.typeOptions, ["Home", "Shop"]);
    assert.deepEqual((await pub("fr")).content.contact.form.typeOptions, ["Résidentiel", "Commercial", "Formation", "Autre"]);
  });

  it("traduit projets et catégories", async () => {
    const img = { src: "/assets/img/hero.svg", alt: { fr: "Vue", ar: "منظر" }, width: 1920, height: 1080 };
    const created = await call("POST", "/api/admin/projects", {
      slug: "dar-test",
      title: { fr: "Dar Test", ar: "دار تجربة", en: "Dar Test" },
      place: { fr: "Tozeur", ar: "توزر" },
      category: "residentiel",
      typeLabel: { fr: "Maison", en: "House" },
      description: { fr: "Une maison." },
      cover: img,
      images: [img],
    });
    assert.equal(created.status, 201);
    const ar = (await pub("ar")).projects.find((p: { slug: string }) => p.slug === "dar-test");
    assert.equal(ar.title, "دار تجربة");
    assert.equal(ar.typeLabel, "Maison");
    assert.equal(ar.cover.alt, "منظر");
    const en = (await pub("en")).projects.find((p: { slug: string }) => p.slug === "dar-test");
    assert.equal(en.typeLabel, "House");
    await call("DELETE", `/api/admin/projects/${created.json.id}`);
    assert.ok(!(await pub("en")).projects.some((p: { slug: string }) => p.slug === "dar-test"));
  });
});

describe("Sections, menu et apparence", () => {
  it("ordonne et masque les sections ; complète et nettoie l’ordre reçu", async () => {
    const r = await call("PUT", "/api/admin/content/home/layout", {
      sections: [
        { key: "contact", visible: true },
        { key: "inconnue", visible: true },
        { key: "services", visible: false },
        { key: "contact", visible: false },
      ],
    });
    assert.equal(r.status, 200);
    const layout = (await pub()).content.home.layout.sections;
    assert.deepEqual(
      layout.map((s: { key: string }) => s.key),
      ["contact", "services", "about", "projects", "formations"],
    );
    assert.equal(layout[1].visible, false);
    await call("DELETE", "/api/admin/content/home/layout");
    assert.equal((await pub()).content.home.layout.sections.find((s: { key: string }) => s.key === "formations").visible, false);
  });

  it("valide les couleurs et les polices", async () => {
    const raw = await admin();
    const bad = await call("PUT", "/api/admin/content/site/design", { ...raw.site.design, wine: "red" });
    assert.equal(bad.status, 400);
    const font = await call("PUT", "/api/admin/content/site/design", { ...raw.site.design, serif: "Comic Sans" });
    assert.equal(font.status, 400);
    const okr = await call("PUT", "/api/admin/content/site/design", { ...raw.site.design, wine: "#1f4e78", serif: "Fraunces" });
    assert.equal(okr.status, 200);
    assert.equal((await pub("ar")).content.site.design.wine, "#1F4E78");
  });

  it("applique menu, bouton et identité dans toutes les langues", async () => {
    const raw = await admin();
    const items = raw.site.nav.items.map((i: { key: string; visible: boolean }) => (i.key === "formations" ? { ...i, visible: false } : i));
    await call("PUT", "/api/admin/content/site/nav", { ...raw.site.nav, items, ctaVisible: false });
    const en = (await pub("en")).content.site.nav;
    assert.equal(en.ctaVisible, false);
    assert.equal(en.items.find((i: { key: string }) => i.key === "formations").visible, false);
  });
});

describe("Pages servies (référencement)", () => {
  it("met la langue, le sens, le titre, la description et les liens de langue dans le HTML", async () => {
    const r = await call("GET", "/ar/services");
    assert.equal(r.status, 200);
    assert.match(r.text, /<html lang="ar" dir="rtl">/);
    assert.match(r.text, /<title>الخدمات · رحاب بعبو<\/title>/);
    assert.match(r.text, /<link rel="alternate" hreflang="en" href="http:\/\/127\.0\.0\.1:\d+\/en\/services">/);
    assert.match(r.text, /<style id="site-theme">:root\{--ink:#0B0B0D;/);
    assert.equal((r.text.match(/<title>/g) ?? []).length, 1);
    const en = await call("GET", "/en/projets/curated-comfort");
    assert.match(en.text, /<html lang="en" dir="ltr">/);
    assert.match(en.text, /<title>Curated Comfort · Rihab Baabou<\/title>/);
  });

  it("suit les modifications du tableau de bord et répond 404 aux pages inconnues", async () => {
    const raw = await admin();
    await call("PUT", "/api/admin/content/contact/seo", { ...raw.contact.seo, title: { ...raw.contact.seo.title, en: "Contact the studio" } });
    assert.match((await call("GET", "/en/contact")).text, /<title>Contact the studio<\/title>/);
    const missing = await call("GET", "/en/projets/inexistant");
    assert.equal(missing.status, 404);
    assert.match(missing.text, /<title>Error 404 · Rihab Baabou<\/title>/);
    const adminPage = await call("GET", "/admin");
    assert.match(adminPage.text, /noindex/);
  });
});
