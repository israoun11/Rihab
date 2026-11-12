// Browser test of the three languages on every page (read-only). Usage: BASE=http://localhost:4000 OUT=/tmp node scripts/e2e/lang.mjs
import pw from "playwright";
const { chromium } = pw;
import assert from "node:assert/strict";
const BASE = process.env.BASE ?? "http://localhost:4100";
const OUT = process.env.OUT ?? ".";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const ok = (m) => console.log("✓", m);

const pages = [
  ["/", "h1"], ["/a-propos", "h1"], ["/services", "h1"], ["/projets", "h1"], ["/projets/digital-vibes", "h1"], ["/formations", "h1"], ["/contact", "h1"], ["/nope", "h1"],
];
const expectHome = { fr: "Explorer les projets", ar: "اكتشف المشاريع", en: "Explore the projects" };

for (const [path] of pages) {
  for (const lang of ["fr", "ar", "en"]) {
    const url = BASE + (lang === "fr" ? path : `/${lang}${path === "/" ? "" : path}`);
    await page.goto(url, { waitUntil: "networkidle" });
    const html = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title }));
    assert.equal(html.lang, lang, url);
    assert.equal(html.dir, lang === "ar" ? "rtl" : "ltr", url);
    assert.ok(html.title.length > 3, url);
    // internal links keep the language
    const hrefs = await page.$$eval("main a[href^='/'], header a[href^='/'], footer a[href^='/']", (as) => as.map((a) => a.getAttribute("href")));
    const bad = hrefs.filter((h) => lang !== "fr" && !h.startsWith(`/${lang}`) && !h.startsWith("/media") && !h.startsWith("/assets"));
    // language switcher links point to other languages, that's expected
    const badNonSwitch = [];
    for (const h of bad) {
      const isSwitch = await page.$(`.lang-switch a[href="${h}"]`);
      if (!isSwitch) badNonSwitch.push(h);
    }
    assert.deepEqual(badNonSwitch, [], `${url} has links leaving the language: ${badNonSwitch}`);
  }
}
ok("8 pages × 3 languages: lang/dir/title correct, every internal link keeps the language");

// Home texts
for (const lang of ["fr", "ar", "en"]) {
  await page.goto(BASE + (lang === "fr" ? "/" : `/${lang}`), { waitUntil: "networkidle" });
  assert.ok(await page.getByText(expectHome[lang]).first().isVisible(), lang);
}
ok("home hero button text is translated in FR / AR / EN");

// Switcher: FR → AR from the nav, persists through navigation and reload, and FR URLs redirect to the saved choice
await page.goto(BASE + "/services", { waitUntil: "networkidle" });
await page.locator(".nav .lang-switch a[hreflang=ar]").click();
await page.waitForURL(BASE + "/ar/services");
await page.waitForFunction(() => document.documentElement.dir === "rtl", null, { timeout: 3000 });
await page.locator(".nav__links a", { hasText: "المشاريع" }).click();
await page.waitForURL(BASE + "/ar/projets");
await page.reload({ waitUntil: "networkidle" });
assert.equal(await page.evaluate(() => document.documentElement.lang), "ar");
await page.goto(BASE + "/contact", { waitUntil: "networkidle" });
await page.waitForURL(BASE + "/ar/contact");
ok("switcher → AR; navigation stays in AR; refresh keeps AR; a French address opens in the saved language");
await page.screenshot({ path: `${OUT}/ar-contact.png`, fullPage: false });
// form validation messages in Arabic
await page.locator("form#formulaire button[type=submit]").click();
const summary = await page.locator(".form__summary").innerText();
assert.match(summary, /حقول|حقل/);
ok("form validation messages are in Arabic");
await page.locator(".nav .lang-switch a[hreflang=en]").click();
await page.waitForURL(BASE + "/en/contact");
await page.locator(".nav .lang-switch a[hreflang=fr]").click();
await page.waitForURL(BASE + "/contact");
await page.goto(BASE + "/projets", { waitUntil: "networkidle" });
assert.equal(new URL(page.url()).pathname, "/projets");
ok("switch back to FR is remembered too");

// Screenshots: desktop + mobile, FR and AR
for (const [name, url] of [["fr-home", "/"], ["ar-home", "/ar"], ["en-home", "/en"], ["ar-services", "/ar/services"], ["ar-projets", "/ar/projets"], ["ar-apropos", "/ar/a-propos"], ["ar-formations", "/ar/formations"], ["ar-project", "/ar/projets/curated-comfort"]]) {
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.removeItem("rb-lang"));
  await page.screenshot({ path: `${OUT}/${name}.png` });
}
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const m = await mobile.newPage();
for (const [name, url] of [["m-ar-home", "/ar"], ["m-fr-home", "/"]]) {
  await m.goto(BASE + url, { waitUntil: "networkidle" });
  await m.screenshot({ path: `${OUT}/${name}.png` });
}
await m.goto(BASE + "/ar/services", { waitUntil: "networkidle" });
await m.locator(".nav__toggle").click();
await m.waitForTimeout(500);
await m.screenshot({ path: `${OUT}/m-ar-menu.png` });
const scrollW = await m.evaluate(() => document.documentElement.scrollWidth);
assert.ok(scrollW <= 390, `horizontal overflow on mobile AR: ${scrollW}`);
ok("mobile AR: menu opens, no horizontal overflow");

console.log(errors.length ? `console errors:\n${[...new Set(errors)].join("\n")}` : "no console errors");
await browser.close();
