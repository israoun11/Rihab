import type { Locale } from "@rihab/shared";

/**
 * The only texts not managed in the dashboard: shown while the content is
 * loading or when the server cannot be reached (so before any content exists).
 */
export const UI_STRINGS: Record<Locale, { loading: string; errorTitle: string; errorText: string; retry: string }> = {
  fr: {
    loading: "Chargement…",
    errorTitle: "Le site est momentanément indisponible.",
    errorText: "Le contenu n’a pas pu être chargé. Une nouvelle tentative est en cours.",
    retry: "Réessayer maintenant",
  },
  ar: {
    loading: "جارٍ التحميل…",
    errorTitle: "الموقع غير متاح مؤقتًا.",
    errorText: "تعذّر تحميل المحتوى. جارٍ إعادة المحاولة.",
    retry: "أعد المحاولة الآن",
  },
  en: {
    loading: "Loading…",
    errorTitle: "The site is temporarily unavailable.",
    errorText: "The content could not be loaded. Trying again.",
    retry: "Try again now",
  },
};
