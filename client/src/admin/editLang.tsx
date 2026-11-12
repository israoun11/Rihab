import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { LOCALES, LOCALE_INFO, isLocale, type Locale } from "@rihab/shared";

/** French names of the languages, for the (French) dashboard. */
export const LANG_NAMES: Record<Locale, string> = { fr: "Français", ar: "Arabe", en: "Anglais" };
export const LANG_IN: Record<Locale, string> = { fr: "en français", ar: "en arabe", en: "en anglais" };

const KEY = "rb-admin-lang";
const Ctx = createContext<{ lang: Locale; setLang: (l: Locale) => void }>({ lang: "fr", setLang: () => undefined });

/** Language currently edited in the dashboard (texts, image descriptions, project and category names). */
export function EditLangProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Locale>(() => {
    try {
      const v = window.localStorage.getItem(KEY);
      return isLocale(v) ? v : "fr";
    } catch {
      return "fr";
    }
  });
  const setLang = useCallback((l: Locale) => {
    set(l);
    try {
      window.localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export const useEditLang = () => useContext(Ctx);

/** FR · AR · EN tabs, with the number of missing translations per language. */
export function EditLangTabs({ gaps }: { gaps?: Partial<Record<Locale, number>> }) {
  const { lang, setLang } = useEditLang();
  return (
    <div className="a-lang" role="group" aria-label="Langue d’édition">
      <span className="a-lang__label">Langue d’édition</span>
      {LOCALES.map((l) => (
        <button key={l} type="button" className="a-lang__btn" aria-pressed={lang === l} onClick={() => setLang(l)} title={LANG_NAMES[l]}>
          {LOCALE_INFO[l].short}
          <span className="a-lang__name">{LANG_NAMES[l]}</span>
          {!!gaps?.[l] && (
            <span className="a-lang__gap" title={`${gaps[l]} texte(s) à traduire ${LANG_IN[l]}`}>
              {gaps[l]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Small "à traduire" marker. */
export function GapBadge({ count, lang }: { count: number; lang: Locale }) {
  if (!count || lang === "fr") return null;
  return (
    <span className="a-pill a-pill--warn">
      {count} à traduire {LANG_IN[lang]}
    </span>
  );
}
