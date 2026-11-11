import type { ImageValue } from "./schema.js";

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
  /** Image shown on the project card in the Projects page. */
  cover: ImageValue;
  /** First image opens the project page (and the "next project" link); the others form the gallery. */
  images: ImageValue[];
  order: number;
}

export type ProjectInput = Omit<Project, "id" | "order">;
export type CategoryInput = Pick<Category, "slug" | "name">;

export interface PublicPayload {
  content: import("./schema.js").SiteContent;
  projects: Project[];
  categories: Category[];
}

const demo = (src: string, width: number, height: number, alt: string): ImageValue => ({
  src: `/assets/img/${src}`,
  width,
  height,
  alt,
  demo: true,
});

export const DEFAULT_CATEGORIES: CategoryInput[] = [
  { slug: "residentiel", name: "Résidentiel" },
  { slug: "commercial", name: "Commercial" },
];

/** The five projects of the original site, with their demonstration images. */
export const DEFAULT_PROJECTS: ProjectInput[] = [
  {
    slug: "curated-comfort",
    title: "Curated Comfort",
    place: "Sousse",
    category: "residentiel",
    typeLabel: "Résidentiel",
    description: "Un espace de vie réunissant salon et cuisine, pensé autour du confort et des usages quotidiens.",
    attribution: "Projet développé au sein d’une entreprise.",
    cover: demo("curated-comfort-1.svg", 1920, 1080, "Vue d’ensemble du salon ouvert sur la cuisine"),
    images: [
      demo("curated-comfort-1.svg", 1920, 1080, "Vue d’ensemble du salon ouvert sur la cuisine"),
      demo("curated-comfort-3.svg", 1920, 1200, "Coin salon près de la fenêtre"),
      demo("curated-comfort-2.svg", 1200, 1500, "Vue de la cuisine et de ses rangements"),
    ],
  },
  {
    slug: "layered-identity",
    title: "Layered Identity",
    place: "Métouia, Gabès",
    category: "residentiel",
    typeLabel: "Résidentiel",
    description: "Un dialogue entre l’expression de la façade et une atmosphère intérieure chaleureuse.",
    attribution: "",
    cover: demo("layered-identity-1.svg", 1200, 1500, "Passage en arc vers les pièces de vie"),
    images: [
      demo("layered-identity-2.svg", 1920, 1200, "Séjour aux teintes chaudes"),
      demo("layered-identity-3.svg", 1920, 1080, "Détail d’étagères et de table"),
      demo("layered-identity-1.svg", 1200, 1500, "Passage en arc vers les pièces de vie"),
    ],
  },
  {
    slug: "digital-vibes",
    title: "Digital Vibes",
    place: "Gabès",
    category: "commercial",
    typeLabel: "Gaming room",
    description: "Un concept d’aménagement consacré à l’expérience du jeu.",
    attribution: "",
    cover: demo("digital-vibes-1.svg", 1920, 1200, "Salle de jeu avec écrans et éclairage d’ambiance"),
    images: [
      demo("digital-vibes-1.svg", 1920, 1200, "Salle de jeu avec écrans et éclairage d’ambiance"),
      demo("digital-vibes-3.svg", 1920, 1080, "Espace détente face aux écrans"),
      demo("digital-vibes-2.svg", 1200, 1500, "Poste de jeu et rangements"),
    ],
  },
  {
    slug: "mobile-store",
    title: "Mobile Store",
    place: "Gabès",
    category: "commercial",
    typeLabel: "Commerce",
    description: "Une étude de façade et d’aménagement intérieur pour une boutique de téléphonie.",
    attribution: "",
    cover: demo("mobile-store-1.svg", 1920, 1200, "Espace de vente avec présentoirs muraux"),
    images: [
      demo("mobile-store-1.svg", 1920, 1200, "Espace de vente avec présentoirs muraux"),
      demo("mobile-store-3.svg", 1920, 1080, "Table de présentation centrale"),
      demo("mobile-store-2.svg", 1200, 1500, "Comptoir et linéaires de présentation"),
    ],
  },
  {
    slug: "flavor-street",
    title: "Flavor Street",
    place: "Sousse",
    category: "commercial",
    typeLabel: "Restauration",
    description: "Un concept de restauration à l’expression affirmée.",
    attribution: "Projet développé au sein d’une entreprise.",
    cover: demo("flavor-street-1.svg", 1200, 1500, "Comptoir et suspensions lumineuses"),
    images: [
      demo("flavor-street-2.svg", 1920, 1200, "Salle de restauration"),
      demo("flavor-street-3.svg", 1920, 1080, "Ambiance générale du comptoir"),
      demo("flavor-street-1.svg", 1200, 1500, "Comptoir et suspensions lumineuses"),
    ],
  },
];
