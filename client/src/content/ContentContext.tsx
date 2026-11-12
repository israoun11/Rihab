import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  LOCALE_INFO,
  fontsHref,
  splitLocalePath,
  themeCss,
  type Category,
  type Locale,
  type Project,
  type PublicPayload,
  type SiteContent,
} from "@rihab/shared";
import { UI_STRINGS } from "../i18n/uiStrings";
import { CONTENT_CHANNEL, CONTENT_STORAGE_KEY } from "./sync";

interface ContentState {
  /** Language of the content currently shown. */
  lang: Locale;
  content: SiteContent;
  projects: Project[];
  categories: Category[];
  /** Fetches the latest saved content again. */
  reload: () => Promise<void>;
}

const Ctx = createContext<ContentState | null>(null);

/** Background refresh while the page is visible, in case a change was saved from another device. */
const POLL_MS = 30_000;

async function fetchPayload(lang: Locale): Promise<PublicPayload> {
  const res = await fetch(`/api/content?lang=${lang}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    // Always ask the server (ETag revalidation): never show content kept by the browser cache.
    cache: "no-cache",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    // Typically a static host answering /api/content with index.html: the API server is not reachable.
    throw new Error("La réponse de /api/content n’est pas du JSON : le serveur de l’API n’est pas joignable à cette adresse.");
  }
  const data = (await res.json()) as PublicPayload;
  if (!data?.content?.site || !Array.isArray(data.projects)) throw new Error("Contenu incomplet.");
  return data;
}

/**
 * Public content provider. The database is the only source of the site's
 * content: it is fetched for the visitor's language, and fetched again when the
 * visitor comes back to the tab, when the dashboard saves a change (in another
 * tab of the same browser), and every 30 s while the page is visible.
 */
export function ContentProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const lang = splitLocalePath(pathname).lang;
  const [payloads, setPayloads] = useState<Partial<Record<Locale, PublicPayload>>>({});
  const [failed, setFailed] = useState(false);
  const shown = useRef<PublicPayload | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;
  const attempt = useRef(0);
  const retryTimer = useRef<number | undefined>(undefined);

  const load = useCallback(async (l: Locale) => {
    try {
      const data = await fetchPayload(l);
      attempt.current = 0;
      setFailed(false);
      // Keep the same object when nothing changed, so the page does not re-render.
      setPayloads((p) => (JSON.stringify(p[l]) === JSON.stringify(data) ? p : { ...p, [l]: data }));
    } catch (err) {
      console.error("Contenu indisponible :", err);
      attempt.current += 1;
      setFailed(true);
      window.clearTimeout(retryTimer.current);
      const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt.current, 5));
      retryTimer.current = window.setTimeout(() => void load(langRef.current), delay);
    }
  }, []);

  const reload = useCallback(() => load(langRef.current), [load]);

  // Language change (or first visit).
  useEffect(() => {
    void load(lang);
  }, [lang, load]);

  // Fresh content when coming back to the tab, when the dashboard saves, and periodically.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void load(langRef.current);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONTENT_STORAGE_KEY) refresh();
    };
    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CONTENT_CHANNEL);
      channel.onmessage = refresh;
    }
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("storage", onStorage);
    window.addEventListener("online", refresh);
    const timer = window.setInterval(refresh, POLL_MS);
    return () => {
      channel?.close();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("online", refresh);
      window.clearInterval(timer);
      window.clearTimeout(retryTimer.current);
    };
  }, [load]);

  // While another language loads, keep showing the current page instead of a blank screen.
  const current = payloads[lang] ?? shown.current;
  if (payloads[lang]) shown.current = payloads[lang];

  const value = useMemo<ContentState | null>(
    () => (current ? { lang: current.lang, content: current.content, projects: current.projects, categories: current.categories, reload } : null),
    [current, reload],
  );

  useDocumentSettings(value);

  if (!value) return <SiteStatus lang={lang} failed={failed} onRetry={reload} />;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Language, direction, colours, fonts and favicon of the document, from the content shown. */
function useDocumentSettings(v: ContentState | null) {
  const lang = v?.lang;
  const design = v?.content.site.design;
  const favicon = v?.content.site.identity.favicon?.src;

  useLayoutEffect(() => {
    if (!lang) return;
    const html = document.documentElement;
    html.lang = lang;
    html.dir = LOCALE_INFO[lang].dir;
  }, [lang]);

  useLayoutEffect(() => {
    if (!design) return;
    let style = document.getElementById("site-theme") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "site-theme";
      document.head.appendChild(style);
    }
    style.textContent = themeCss(design);
    const href = fontsHref(design);
    let link = document.getElementById("site-fonts") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "site-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = design.ink;
  }, [design]);

  useEffect(() => {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      link?.remove();
      return;
    }
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = favicon;
  }, [favicon]);
}

/** First load (or server unreachable on first load). */
function SiteStatus({ lang, failed, onRetry }: { lang: Locale; failed: boolean; onRetry: () => void }) {
  const t = UI_STRINGS[lang];
  useLayoutEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = LOCALE_INFO[lang].dir;
  }, [lang]);
  return (
    <main className="site-status" aria-busy={!failed}>
      {failed ? (
        <div className="site-status__box" role="alert">
          <p className="site-status__title">{t.errorTitle}</p>
          <p>{t.errorText}</p>
          <button type="button" className="btn btn--ghost" onClick={onRetry}>
            {t.retry}
          </button>
        </div>
      ) : (
        <p className="site-status__loading" role="status">
          <span className="site-status__dot" aria-hidden="true"></span>
          <span className="sr-only">{t.loading}</span>
        </p>
      )}
    </main>
  );
}

export function useSite(): ContentState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite doit être utilisé dans <ContentProvider>.");
  return v;
}
