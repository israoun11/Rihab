import {
  LOCALES,
  fontsHref,
  themeCss,
  LOCALE_INFO,
  localizePath,
  plain,
  splitLocalePath,
  type Locale,
  type SiteContent,
} from "@rihab/shared";
import { getPublicContent } from "./content.js";
import { listPublicProjects } from "./projects.js";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export interface PageMeta {
  lang: Locale;
  status: number;
  title: string;
  description: string;
  /** Address without the language prefix, used for the alternate-language links. */
  path: string;
}

/** Title and description of the page at `pathname`, in its language, from the saved content. */
export async function pageMeta(pathname: string): Promise<{ meta: PageMeta; content: SiteContent }> {
  const { lang, path } = splitLocalePath(pathname.replace(/\/+$/, "") || "/");
  const content = await getPublicContent(lang);
  const c = content;
  const name = c.site.identity.name;
  const seo: Record<string, { title: string; description: string }> = {
    "/": c.home.seo,
    "/a-propos": c.about.seo,
    "/services": c.services.seo,
    "/projets": c.projects.seo,
    "/formations": c.formations.seo,
    "/contact": c.contact.seo,
  };
  let meta: PageMeta | null = null;
  const page = seo[path];
  if (page) meta = { lang, status: 200, title: page.title, description: page.description, path };
  const project = /^\/projets\/([a-z0-9-]+)$/.exec(path)?.[1];
  if (project) {
    const p = (await listPublicProjects(lang)).find((x) => x.slug === project);
    if (p) meta = { lang, status: 200, title: `${p.title} · ${name}`, description: `${p.title}, ${p.place} · ${p.typeLabel}. ${p.description}`, path };
  }
  meta ??= { lang, status: 404, title: `${c.site.notFound.label} · ${name}`, description: c.site.notFound.text, path };
  return { meta, content };
}

/** Puts the page's language, direction, title, description and social tags into index.html. */
export function renderIndex(template: string, meta: PageMeta, content: SiteContent, origin: string): string {
  const info = LOCALE_INFO[meta.lang];
  const title = esc(plain(meta.title));
  const description = esc(plain(meta.description));
  const { identity, seo, design } = content.site;
  const url = (lang: Locale) => `${origin}${localizePath(meta.path, lang)}`;

  const head: string[] = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<meta name="theme-color" content="${esc(design.ink)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(identity.name)}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:locale" content="${info.ogLocale}">`,
    `<meta property="og:url" content="${esc(url(meta.lang))}">`,
    `<link rel="canonical" href="${esc(url(meta.lang))}">`,
    ...LOCALES.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(url(l))}">`),
    `<link rel="alternate" hreflang="x-default" href="${esc(url("fr"))}">`,
    `<style id="site-theme">${themeCss(design)}</style>`,
    `<link rel="stylesheet" id="site-fonts" href="${esc(fontsHref(design))}">`,
  ];
  if (seo.shareImage) {
    head.push(`<meta property="og:image" content="${esc(origin + seo.shareImage.src)}">`, `<meta name="twitter:card" content="summary_large_image">`);
  }
  if (identity.favicon) head.push(`<link rel="icon" href="${esc(identity.favicon.src)}">`);

  return template
    .replace(/<html[^>]*>/, `<html lang="${meta.lang}" dir="${info.dir}">`)
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/<meta (?:name="(?:description|theme-color)"|property="og:[^"]+")[^>]*>\s*/g, "")
    .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/, "")
    .replace("</head>", `${head.join("\n")}\n</head>`);
}
