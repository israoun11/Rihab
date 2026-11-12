// Browser test of the whole dashboard → site workflow. It CHANGES the content: run it against a test database only.
// Usage: npm run build; start the server on a test database; then  BASE=http://localhost:4000 ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/e2e/admin.mjs
import pw from "playwright";
import assert from "node:assert/strict";
const { chromium } = pw;
const BASE = process.env.BASE ?? "http://localhost:4100";
const SP = process.env.SP ?? new URL(".", import.meta.url).pathname;
const OUT = process.env.OUT ?? SP;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const A = await ctx.newPage(); // dashboard
const P = await ctx.newPage(); // public site, left open in another tab
for (const p of [A, P]) p.on("dialog", (d) => d.accept());
const errors = [];
for (const p of [A, P]) p.on("pageerror", (e) => errors.push(e.message));
const ok = (m) => console.log("✓", m);
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const L = (name) => new RegExp(`^${esc(name)}\\s*(À traduire)?$`);
const card = (title) => A.locator("section.a-card").filter({ has: A.locator("h2", { hasText: new RegExp(`^${title}$`) }) });
const saveCard = async (c) => {
  await c.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await A.waitForTimeout(150);
  await c.getByRole("button", { name: "Enregistrer", exact: true }).isDisabled();
  await A.locator(".a-toast--ok").last().waitFor();
};
const editLang = async (l) => A.locator(".a-lang__btn", { hasText: l }).first().click();
const text = async (page, sel) => ((await page.locator(sel).first().textContent()) ?? "").trim();

/* ---------- Login ---------- */
await A.goto(BASE + "/admin");
await A.fill("#login-email", process.env.ADMIN_EMAIL ?? "admin@test.local");
await A.fill("#login-password", process.env.ADMIN_PASSWORD ?? "mot-de-passe-solide");
await A.click("button[type=submit]");
await A.getByRole("heading", { name: "Accueil", level: 1 }).waitFor();
ok("signed in to the dashboard");

await P.goto(BASE + "/", { waitUntil: "networkidle" });

/* ---------- 1. Edit text → public tab updates without reload ---------- */
let hero = card("Section d’ouverture");
await hero.getByLabel(L("Surtitre")).fill("Studio d’architecture intérieure · essai");
await saveCard(hero);
await P.waitForFunction(() => document.querySelector(".hero__label")?.textContent?.includes("essai"), null, { timeout: 5000 });
ok("1. text edited in the dashboard appears on the open public tab without reloading");

/* ---------- Translation of the same text ---------- */
await editLang("AR");
hero = card("Section d’ouverture");
assert.ok(await hero.locator(".a-pill--warn").first().isVisible(), "missing AR translation flagged");
await hero.getByLabel(L("Surtitre")).fill("استوديو الهندسة الداخلية · تجربة");
await saveCard(hero);
await P.goto(BASE + "/ar", { waitUntil: "networkidle" });
assert.equal(await text(P, ".hero__label"), "استوديو الهندسة الداخلية · تجربة");
await P.goto(BASE + "/en", { waitUntil: "networkidle" });
assert.equal(await text(P, ".hero__label"), "Studio d’architecture intérieure · essai"); // no EN yet → French
ok("6. translations managed per language in the dashboard (AR shown in Arabic, missing EN falls back to French and is flagged)");
await editLang("FR");

/* ---------- 2. Replace an image ---------- */
const about = card("À propos \\(sur l’accueil\\)");
await about.getByRole("button", { name: "Remplacer l’image" }).first().click();
await A.locator(".a-modal input[type=file]").setInputFiles(`${SP}/new-portrait.png`);
await A.locator(".a-toast--ok", { hasText: "médiathèque" }).waitFor();
await A.getByRole("button", { name: "Utiliser cette image" }).click();
await saveCard(about);
await P.goto(BASE + "/", { waitUntil: "networkidle" });
const src = await P.locator(".about__portrait img").getAttribute("src");
assert.match(src, /^\/media\/[a-f0-9]{24}$/);
const imgRes = await P.request.get(BASE + src);
assert.equal(imgRes.status(), 200);
assert.equal(imgRes.headers()["content-type"], "image/png");
const altAr = await (async () => { await P.goto(BASE + "/ar", { waitUntil: "networkidle" }); return P.locator(".about__portrait img").getAttribute("alt"); })();
assert.match(altAr, /رحاب/); // the Arabic description of the replaced image is kept
ok("2. image replaced through upload: new file served from the database, shown in every language, descriptions kept");

/* ---------- 3. Add content (service), 4. delete it ---------- */
await A.goto(BASE + "/admin/pages/services");
let list = card("Domaines d’intervention");
await list.getByRole("button", { name: "+ Ajouter : service" }).click();
const item = list.locator(".a-item").last();
await item.getByLabel(L("Titre")).fill("Conseil couleurs");
await item.getByLabel(L("Description")).fill("Choix des teintes et des finitions pour chaque pièce.");
await saveCard(list);
await P.goto(BASE + "/services", { waitUntil: "networkidle" });
assert.ok(await P.getByText("Conseil couleurs").isVisible());
await editLang("AR");
list = card("Domaines d’intervention");
await list.locator(".a-item").last().getByLabel(L("Titre")).fill("استشارة الألوان");
await list.locator(".a-item").last().getByLabel(L("Description")).fill("اختيار الألوان واللمسات النهائية لكلّ غرفة.");
await saveCard(list);
await P.goto(BASE + "/ar/services", { waitUntil: "networkidle" });
assert.ok(await P.getByText("استشارة الألوان").isVisible());
ok("3. new service added in FR, then translated in AR: appears on both pages");
await editLang("FR");
list = card("Domaines d’intervention");
await list.locator(".a-item").last().getByRole("button", { name: "Supprimer" }).click();
await saveCard(list);
for (const u of ["/services", "/ar/services"]) {
  await P.goto(BASE + u, { waitUntil: "networkidle" });
  assert.equal(await P.getByText(/Conseil couleurs|استشارة الألوان/).count(), 0);
}
ok("4. deleted service no longer appears in any language");

/* ---------- 5. Sections: order and visibility, nav, design, contact, SEO ---------- */
await A.goto(BASE + "/admin/pages/home");
const layout = card("Sections de la page \\(ordre et affichage\\)");
await layout.getByRole("checkbox", { name: "Services" }).uncheck();
await layout.getByRole("checkbox", { name: "Formations" }).check();
await layout.getByRole("button", { name: "Monter contact 5" }).click();
await saveCard(layout);
await P.goto(BASE + "/", { waitUntil: "networkidle" });
const ids = await P.$$eval("main > section, main > .section", (s) => s.map((x) => x.id || x.className.split(" ").pop()));
assert.ok(!ids.includes("services"), "services hidden");
assert.ok(ids.includes("formations"), "formations preview shown");
assert.ok(ids.indexOf("cta-band") < ids.indexOf("formations"), `contact moved up: ${ids}`);
ok(`5a. home sections reordered and hidden/shown: ${ids.join(" › ")}`);

await A.goto(BASE + "/admin/pages/site");
const nav = card("Navigation");
await nav.getByRole("checkbox", { name: "Formations" }).uncheck();
await nav.getByRole("textbox", { name: L("Accueil") }).fill("Accueil du studio");
await saveCard(nav);
const design = card("Apparence \\(couleurs et polices\\)");
await design.getByRole("textbox", { name: "Couleur d’accent", exact: true }).fill("#1F4E78");
await design.getByLabel(L("Police des titres")).selectOption("Playfair Display");
await saveCard(design);
const coords = card("Coordonnées");
await coords.getByLabel("Téléphone (affiché)").fill("+216 20 000 000");
await saveCard(coords);
await P.goto(BASE + "/services", { waitUntil: "networkidle" });
const navTexts = await P.$$eval(".nav__links a", (as) => as.map((a) => a.textContent.trim()));
assert.ok(!navTexts.includes("Formations") && navTexts.includes("Accueil du studio"), navTexts.join("|"));
const footerNav = await P.$$eval(".fc-nav a", (as) => as.map((a) => a.textContent.trim()));
assert.ok(!footerNav.includes("Formations"));
const wine = await P.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--wine").trim());
assert.equal(wine.toUpperCase(), "#1F4E78");
const serif = await P.evaluate(() => getComputedStyle(document.querySelector(".page-title")).fontFamily);
assert.match(serif, /Playfair Display/);
assert.ok(await P.locator("footer a[href='tel:+21620000000']").isVisible());
const html = await (await P.request.get(BASE + "/services")).text();
assert.match(html, /--wine:#1F4E78/); // applied before the app starts (no flash of old colours)
ok("5b. menu (label + hidden entry, also in the footer), accent colour, heading font and phone number all follow the dashboard");

await editLang("EN");
await A.goto(BASE + "/admin/pages/home");
const seo = card("Référencement \\(onglet du navigateur et moteurs de recherche\\)");
await seo.getByLabel(L("Titre de la page")).fill("Rihab Baabou · Interior architect (test)");
await saveCard(seo);
const enHtml = await (await P.request.get(BASE + "/en")).text();
assert.match(enHtml, /<title>Rihab Baabou · Interior architect \(test\)<\/title>/);
await P.goto(BASE + "/en", { waitUntil: "networkidle" });
assert.equal(await P.title(), "Rihab Baabou · Interior architect (test)");
ok("5c. SEO title edited in English: in the served HTML and in the browser tab");
await editLang("FR");

/* ---------- Projects: create, translate, delete; category rename ---------- */
await A.goto(BASE + "/admin/projets/nouveau");
await A.getByLabel(L("Nom du projet")).fill("Villa Djerba");
await A.getByLabel(L("Lieu")).fill("Djerba");
await A.getByLabel(L("Type de projet")).fill("Villa");
await A.getByLabel(L("Description")).fill("Une maison de vacances ouverte sur le jardin.");
await A.locator("section.a-card", { hasText: "Image de la carte" }).getByRole("button", { name: "Ajouter une image" }).click();
await A.locator(".a-modal input[type=file]").setInputFiles(`${SP}/new-project.png`);
await A.locator(".a-toast--ok", { hasText: "médiathèque" }).waitFor();
await A.getByRole("button", { name: "Utiliser cette image" }).click();
await A.locator("section.a-card", { hasText: "Images du projet" }).getByRole("button", { name: "Ajouter une image" }).click();
await A.locator(".a-modal .a-thumb").first().click();
await A.getByRole("button", { name: "Utiliser cette image" }).click();
await A.getByRole("button", { name: "Créer le projet" }).click();
await A.waitForURL(/\/admin\/projets\/[a-f0-9]{24}$/);
await editLang("AR");
await A.getByLabel(L("Nom du projet")).fill("فيلا جربة");
await A.getByLabel(L("Lieu")).fill("جربة");
await A.getByRole("button", { name: "Enregistrer", exact: true }).click();
await A.locator(".a-toast--ok", { hasText: "Projet enregistré" }).waitFor();
await P.goto(BASE + "/projets", { waitUntil: "networkidle" });
assert.ok(await P.getByText("Djerba · Villa").isVisible());
await P.goto(BASE + "/ar/projets/villa-djerba", { waitUntil: "networkidle" });
assert.equal(await text(P, "h1"), "فيلا جربة");
assert.equal(await P.title(), "فيلا جربة · رحاب بعبو");
ok("3b. new project with an uploaded image: listed on /projets, translated page at /ar/projets/villa-djerba");

await A.goto(BASE + "/admin/projets");
await editLang("EN");
const catInput = A.getByRole("textbox", { name: /Nom de la catégorie Résidentiel/ });
await catInput.fill("Homes");
await A.locator(".a-list__row", { has: catInput }).getByRole("button", { name: "Enregistrer" }).click();
await A.locator(".a-toast--ok", { hasText: "Catégorie renommée" }).waitFor();
await P.goto(BASE + "/en/projets", { waitUntil: "networkidle" });
assert.ok(await P.locator(".filters").getByText("Homes").isVisible());
await editLang("FR");
await A.locator(".a-list__row", { hasText: "Villa Djerba" }).getByRole("button", { name: "Supprimer" }).click();
await A.locator(".a-toast--ok", { hasText: "Projet supprimé" }).waitFor();
for (const u of ["/projets", "/ar/projets"]) {
  await P.goto(BASE + u, { waitUntil: "networkidle" });
  assert.equal(await P.getByText(/Villa Djerba|فيلا جربة|Djerba · Villa/).count(), 0);
}
const gone = await P.request.get(BASE + "/projets/villa-djerba");
assert.equal(gone.status(), 404);
ok("4b. category renamed in English shows on /en/projets; deleted project is gone everywhere (page answers 404)");

/* ---------- 8. Refresh: everything persists ---------- */
await P.goto(BASE + "/ar", { waitUntil: "networkidle" });
await P.reload({ waitUntil: "networkidle" });
assert.equal(await text(P, ".hero__label"), "استوديو الهندسة الداخلية · تجربة");
assert.equal(await P.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--wine").trim().toUpperCase()), "#1F4E78");
ok("8. after a refresh, saved content, translations and design are still there");

/* ---------- Restore originals (Rétablir le contenu d’origine) ---------- */
await A.goto(BASE + "/admin/pages/site");
await card("Apparence \\(couleurs et polices\\)").getByRole("button", { name: "Rétablir le contenu d’origine" }).click();
await A.locator(".a-toast--ok", { hasText: "rétabli" }).waitFor();
await P.goto(BASE + "/", { waitUntil: "networkidle" });
assert.equal(await P.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--wine").trim().toUpperCase()), "#781F35");
ok("restoring the original design brings back the original colours");

await A.screenshot({ path: `${OUT}/admin-site.png` });
await A.goto(BASE + "/admin/pages/home");
await editLang("AR");
await A.screenshot({ path: `${OUT}/admin-home-ar.png` });
console.log(errors.length ? "page errors:\n" + errors.join("\n") : "no page errors");
await browser.close();
