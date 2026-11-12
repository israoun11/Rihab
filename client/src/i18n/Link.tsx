import { forwardRef } from "react";
import { Link as RouterLink, useLocation, type LinkProps } from "react-router-dom";
import { localizePath, splitLocalePath, type Locale } from "@rihab/shared";

/** Language of the current address: /ar/… → ar, /en/… → en, anything else → fr. */
export function useLang(): Locale {
  return splitLocalePath(useLocation().pathname).lang;
}

/** Address of the current page without its language prefix. */
export function usePagePath(): string {
  return splitLocalePath(useLocation().pathname).path;
}

/** Adds the current language prefix to internal addresses. */
export function useLocalize(): (to: string) => string {
  const lang = useLang();
  return (to: string) => localizePath(to, lang);
}

/**
 * Drop-in replacement for react-router's Link: internal addresses ("/contact")
 * keep the visitor's language ("/en/contact", "/ar/contact").
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps & { to: string }>(function Link({ to, ...rest }, ref) {
  const lang = useLang();
  return <RouterLink ref={ref} to={localizePath(to, lang)} {...rest} />;
});
