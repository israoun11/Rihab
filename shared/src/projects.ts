import type { ImageValue, SiteContent } from "./schema.js";
import { pickText, resolveImage, type Locale, type LocalizedText, type RawImage } from "./i18n.js";

/* ---------- As shown on the public site (one language) ---------- */

export interface Category {
  id: string;
  /** Stable key used in project records and URLs-free filters. Cannot change once created. */
  slug: string;
  name: string;
  order: number;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  place: string;
  /** Slug of the category the project belongs to. */
  category: string;
  /** What the project is, e.g. "Résidentiel", "Gaming room", "Restauration". */
  typeLabel: string;
  description: string;
  /** Optional context line, e.g. "Projet développé au sein d’une entreprise." */
  attribution: string;
  /**
   * Image shown on the project card in the Projects page. Falls back to the
   * first image when the stored cover is missing; null when the project has no
   * usable image at all (incomplete data), and the site then shows an empty frame.
   */
  cover: ImageValue | null;
  /** First image opens the project page (and the "next project" link); the others form the gallery. */
  images: ImageValue[];
  order: number;
}

/* ---------- As stored and edited in the dashboard (every language) ---------- */

export const PROJECT_TEXT_FIELDS = ["title", "place", "typeLabel", "description", "attribution"] as const;
export type ProjectTextField = (typeof PROJECT_TEXT_FIELDS)[number];

export interface ProjectRecord {
  id: string;
  slug: string;
  title: LocalizedText;
  place: LocalizedText;
  category: string;
  typeLabel: LocalizedText;
  description: LocalizedText;
  attribution: LocalizedText;
  /** null when the stored project has no usable cover (data saved outside the dashboard). */
  cover: RawImage | null;
  images: RawImage[];
  order: number;
}

export interface CategoryRecord {
  id: string;
  slug: string;
  name: LocalizedText;
  order: number;
}

export type ProjectInput = Omit<ProjectRecord, "id" | "order">;
export type CategoryInput = Pick<CategoryRecord, "slug" | "name">;

export interface PublicPayload {
  lang: Locale;
  content: SiteContent;
  projects: Project[];
  categories: Category[];
}

export function resolveProject(p: ProjectRecord, lang: Locale): Project {
  // Entries without a usable image (no src) are left out instead of reaching the page as null.
  const images = p.images.map((i) => resolveImage(i, lang)).filter((i): i is ImageValue => i !== null);
  return {
    id: p.id,
    slug: p.slug,
    title: pickText(p.title, lang),
    place: pickText(p.place, lang),
    category: p.category,
    typeLabel: pickText(p.typeLabel, lang),
    description: pickText(p.description, lang),
    attribution: pickText(p.attribution, lang),
    cover: resolveImage(p.cover, lang) ?? images[0] ?? null,
    images,
    order: p.order,
  };
}

export function resolveCategory(c: CategoryRecord, lang: Locale): Category {
  return { id: c.id, slug: c.slug, name: pickText(c.name, lang), order: c.order };
}

/** Number of texts (and image descriptions) of a project still missing in a language. */
export function projectGaps(p: Pick<ProjectRecord, ProjectTextField | "cover" | "images">, lang: Locale): number {
  if (lang === "fr") return 0;
  const missing = (t: LocalizedText | undefined) => !!t?.fr?.trim() && !t[lang]?.trim();
  let n = PROJECT_TEXT_FIELDS.filter((k) => missing(p[k])).length;
  for (const img of [p.cover, ...p.images]) if (img && missing(img.alt)) n++;
  return n;
}

type L = { ar: string; en: string };
const T = (fr: string, t: L): LocalizedText => ({ fr, ...t });

const demo = (src: string, width: number, height: number, fr: string, t: L): RawImage => ({
  src: `/assets/img/${src}`,
  width,
  height,
  alt: T(fr, t),
  demo: true,
});

export const DEFAULT_CATEGORIES: CategoryInput[] = [
  { slug: "residentiel", name: T("Résidentiel", { ar: "سكني", en: "Residential" }) },
  { slug: "commercial", name: T("Commercial", { ar: "تجاري", en: "Commercial" }) },
];

/* Image descriptions shared by several images */
const A = {
  cc1: ["Vue d’ensemble du salon ouvert sur la cuisine", { ar: "منظر عام لغرفة الجلوس المفتوحة على المطبخ", en: "Overall view of the living room open to the kitchen" }],
  cc3: ["Coin salon près de la fenêtre", { ar: "ركن الجلوس قرب النافذة", en: "Seating corner by the window" }],
  cc2: ["Vue de la cuisine et de ses rangements", { ar: "منظر المطبخ وخزائنه", en: "View of the kitchen and its storage" }],
  li1: ["Passage en arc vers les pièces de vie", { ar: "ممرّ مقوّس نحو غرف المعيشة", en: "Arched passage to the living areas" }],
  li2: ["Séjour aux teintes chaudes", { ar: "غرفة معيشة بألوان دافئة", en: "Living room in warm tones" }],
  li3: ["Détail d’étagères et de table", { ar: "تفصيل لرفوف وطاولة", en: "Detail of shelves and table" }],
  dv1: ["Salle de jeu avec écrans et éclairage d’ambiance", { ar: "قاعة ألعاب بشاشات وإضاءة محيطة", en: "Gaming room with screens and ambient lighting" }],
  dv3: ["Espace détente face aux écrans", { ar: "فضاء استرخاء مقابل الشاشات", en: "Lounge area facing the screens" }],
  dv2: ["Poste de jeu et rangements", { ar: "ركن لعب وخزائن", en: "Gaming station and storage" }],
  ms1: ["Espace de vente avec présentoirs muraux", { ar: "فضاء بيع بواجهات عرض جدارية", en: "Sales area with wall displays" }],
  ms3: ["Table de présentation centrale", { ar: "طاولة عرض مركزية", en: "Central display table" }],
  ms2: ["Comptoir et linéaires de présentation", { ar: "منضدة ورفوف عرض", en: "Counter and display shelving" }],
  fs1: ["Comptoir et suspensions lumineuses", { ar: "منضدة وإضاءة معلّقة", en: "Counter and pendant lights" }],
  fs2: ["Salle de restauration", { ar: "قاعة الأكل", en: "Dining room" }],
  fs3: ["Ambiance générale du comptoir", { ar: "الأجواء العامة حول المنضدة", en: "General atmosphere around the counter" }],
} as const satisfies Record<string, readonly [string, L]>;
const img = (file: string, w: number, h: number, key: keyof typeof A) => demo(file, w, h, A[key][0], A[key][1]);
const BY_COMPANY = T("Projet développé au sein d’une entreprise.", { ar: "مشروع أُنجز ضمن شركة.", en: "Project developed within a company." });
const NONE = T("", { ar: "", en: "" });

/** The five projects of the original site, with their demonstration images. */
export const DEFAULT_PROJECTS: ProjectInput[] = [
  {
    slug: "curated-comfort",
    title: T("Curated Comfort", { ar: "Curated Comfort", en: "Curated Comfort" }),
    place: T("Sousse", { ar: "سوسة", en: "Sousse" }),
    category: "residentiel",
    typeLabel: T("Résidentiel", { ar: "سكني", en: "Residential" }),
    description: T("Un espace de vie réunissant salon et cuisine, pensé autour du confort et des usages quotidiens.", {
      ar: "فضاء عيش يجمع غرفة الجلوس والمطبخ، صُمّم حول الراحة والاستخدامات اليومية.",
      en: "A living space bringing together the living room and the kitchen, designed around comfort and everyday use.",
    }),
    attribution: BY_COMPANY,
    cover: img("curated-comfort-1.svg", 1920, 1080, "cc1"),
    images: [img("curated-comfort-1.svg", 1920, 1080, "cc1"), img("curated-comfort-3.svg", 1920, 1200, "cc3"), img("curated-comfort-2.svg", 1200, 1500, "cc2")],
  },
  {
    slug: "layered-identity",
    title: T("Layered Identity", { ar: "Layered Identity", en: "Layered Identity" }),
    place: T("Métouia, Gabès", { ar: "المطوية، قابس", en: "Métouia, Gabès" }),
    category: "residentiel",
    typeLabel: T("Résidentiel", { ar: "سكني", en: "Residential" }),
    description: T("Un dialogue entre l’expression de la façade et une atmosphère intérieure chaleureuse.", {
      ar: "حوار بين تعبير الواجهة وأجواء داخلية دافئة.",
      en: "A dialogue between the expression of the façade and a warm interior atmosphere.",
    }),
    attribution: NONE,
    cover: img("layered-identity-1.svg", 1200, 1500, "li1"),
    images: [img("layered-identity-2.svg", 1920, 1200, "li2"), img("layered-identity-3.svg", 1920, 1080, "li3"), img("layered-identity-1.svg", 1200, 1500, "li1")],
  },
  {
    slug: "digital-vibes",
    title: T("Digital Vibes", { ar: "Digital Vibes", en: "Digital Vibes" }),
    place: T("Gabès", { ar: "قابس", en: "Gabès" }),
    category: "commercial",
    typeLabel: T("Gaming room", { ar: "قاعة ألعاب", en: "Gaming room" }),
    description: T("Un concept d’aménagement consacré à l’expérience du jeu.", {
      ar: "مفهوم تهيئة مخصّص لتجربة اللعب.",
      en: "A fit-out concept devoted to the gaming experience.",
    }),
    attribution: NONE,
    cover: img("digital-vibes-1.svg", 1920, 1200, "dv1"),
    images: [img("digital-vibes-1.svg", 1920, 1200, "dv1"), img("digital-vibes-3.svg", 1920, 1080, "dv3"), img("digital-vibes-2.svg", 1200, 1500, "dv2")],
  },
  {
    slug: "mobile-store",
    title: T("Mobile Store", { ar: "Mobile Store", en: "Mobile Store" }),
    place: T("Gabès", { ar: "قابس", en: "Gabès" }),
    category: "commercial",
    typeLabel: T("Commerce", { ar: "محلّ تجاري", en: "Retail" }),
    description: T("Une étude de façade et d’aménagement intérieur pour une boutique de téléphonie.", {
      ar: "دراسة واجهة وتهيئة داخلية لمحلّ هواتف.",
      en: "A façade and interior fit-out study for a mobile phone shop.",
    }),
    attribution: NONE,
    cover: img("mobile-store-1.svg", 1920, 1200, "ms1"),
    images: [img("mobile-store-1.svg", 1920, 1200, "ms1"), img("mobile-store-3.svg", 1920, 1080, "ms3"), img("mobile-store-2.svg", 1200, 1500, "ms2")],
  },
  {
    slug: "flavor-street",
    title: T("Flavor Street", { ar: "Flavor Street", en: "Flavor Street" }),
    place: T("Sousse", { ar: "سوسة", en: "Sousse" }),
    category: "commercial",
    typeLabel: T("Restauration", { ar: "مطعم", en: "Restaurant" }),
    description: T("Un concept de restauration à l’expression affirmée.", {
      ar: "مفهوم مطعم بهوية بصرية قويّة.",
      en: "A restaurant concept with a bold expression.",
    }),
    attribution: BY_COMPANY,
    cover: img("flavor-street-1.svg", 1200, 1500, "fs1"),
    images: [img("flavor-street-2.svg", 1920, 1200, "fs2"), img("flavor-street-3.svg", 1920, 1080, "fs3"), img("flavor-street-1.svg", 1200, 1500, "fs1")],
  },
];
