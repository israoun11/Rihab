import type { SiteContent } from "@rihab/shared";

export type NavKey = "home" | "about" | "services" | "projects" | "formations" | "contact";

export interface NavItem {
  key: NavKey;
  to: string;
  label: string;
}

/** Fixed order requested: Accueil, À propos, Services, Projets, Formations (Contact last). */
export function navItems(nav: SiteContent["site"]["nav"], withContact: boolean): NavItem[] {
  const items: NavItem[] = [
    { key: "home", to: "/", label: nav.home },
    { key: "about", to: "/#a-propos", label: nav.about },
    { key: "services", to: "/services", label: nav.services },
    { key: "projects", to: "/projets", label: nav.projects },
    { key: "formations", to: "/formations", label: nav.formations },
  ];
  if (withContact) items.push({ key: "contact", to: "/contact", label: nav.contact });
  return items;
}

/** Which navigation entry the current address belongs to. */
export function currentNavKey(pathname: string, hash: string): NavKey | null {
  if (pathname === "/") return hash === "#a-propos" ? "about" : "home";
  if (pathname.startsWith("/a-propos")) return "about";
  if (pathname.startsWith("/services")) return "services";
  if (pathname.startsWith("/projets")) return "projects";
  if (pathname.startsWith("/formations")) return "formations";
  if (pathname.startsWith("/contact")) return "contact";
  return null;
}
