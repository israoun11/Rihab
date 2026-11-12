import { useLocation, useNavigate } from "react-router-dom";
import { LOCALES, LOCALE_INFO, localizePath, splitLocalePath, type Locale } from "@rihab/shared";
import { storeLang } from "./storage";

/**
 * FR · AR · EN switcher. Opens the same page in the chosen language and
 * remembers the choice for the next visits.
 */
export function LangSwitch({ label, className = "", onSwitch }: { label: string; className?: string; onSwitch?: () => void }) {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const { lang, path } = splitLocalePath(pathname);

  const go = (to: Locale) => (e: React.MouseEvent) => {
    e.preventDefault();
    storeLang(to);
    onSwitch?.();
    if (to !== lang) navigate(localizePath(path, to) + search + hash);
  };

  return (
    <div className={`lang-switch ${className}`.trim()} role="group" aria-label={label}>
      {LOCALES.map((l) => (
        <a
          key={l}
          href={localizePath(path, l) + search + hash}
          hrefLang={l}
          lang={l}
          aria-label={LOCALE_INFO[l].name}
          aria-current={l === lang ? "true" : undefined}
          onClick={go(l)}
        >
          {LOCALE_INFO[l].short}
        </a>
      ))}
    </div>
  );
}
