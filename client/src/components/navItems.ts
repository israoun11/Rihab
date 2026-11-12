import { visibleKeys, type SiteContent } from "@rihab/shared";

export type NavKey = "home" | "about" | "services" | "projects" | "formations" | "contact";

export interface NavItem {
  key: NavKey;
  to: string;
  label: string;
}

const KEYS: NavKey[] = ["home", "about", "services", "projects", "formations", "contact"];
const isNavKey = (k: string): k is NavKey => (KEYS as string[]).includes(k);

/**
 * Menu entries in the order and with the visibility set in the dashboard
 * (Éléments communs › Navigation). Contact is listed only where asked
 * (mobile menu, footer); on desktop it is the button of the bar.
 * "À propos" scrolls to the About preview of the homepage while it is shown there.
 */
export function navItems(content: SiteContent, withContact: boolean): NavItem[] {
  const nav = content.site.nav;
  const homeAbout = content.home.layout.sections.some((s) => s.key === "about" && s.visible);
  const to: Record<NavKey, string> = {
    home: "/",
    about: homeAbout ? "/#a-propos" : "/a-propos",
    services: "/services",
    projects: "/projets",
    formations: "/formations",
    contact: "/contact",
  };
  return visibleKeys(nav.items)
    .filter(isNavKey)
    .filter((k) => withContact || k !== "contact")
    .map((key) => ({ key, to: to[key], label: nav[key] }));
}

/** Which navigation entry the current address (without language prefix) belongs to. */
export function currentNavKey(pathname: string, hash: string): NavKey | null {
  if (pathname === "/") return hash === "#a-propos" ? "about" : "home";
  if (pathname.startsWith("/a-propos")) return "about";
  if (pathname.startsWith("/services")) return "services";
  if (pathname.startsWith("/projets")) return "projects";
  if (pathname.startsWith("/formations")) return "formations";
  if (pathname.startsWith("/contact")) return "contact";
  return null;
}
