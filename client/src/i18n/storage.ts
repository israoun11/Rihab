import { isLocale, type Locale } from "@rihab/shared";

const KEY = "rb-lang";

/** Language chosen by the visitor with the language switcher (kept across visits). */
export function storedLang(): Locale | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return isLocale(v) ? v : null;
  } catch {
    return null;
  }
}

export function storeLang(lang: Locale): void {
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    /* private mode: the language still follows the address */
  }
}
