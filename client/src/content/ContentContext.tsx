import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CONTENT,
  DEFAULT_PROJECTS,
  type Category,
  type Project,
  type PublicPayload,
  type SiteContent,
} from "@rihab/shared";
import { api } from "../api/http";

interface ContentState {
  content: SiteContent;
  projects: Project[];
  categories: Category[];
  /** Fetches the latest saved content (used after a save in the dashboard). */
  reload: () => Promise<void>;
}

const Ctx = createContext<ContentState | null>(null);

/** Content bundled with the app, used only if the API cannot be reached. */
const fallback = (): PublicPayload => ({
  content: DEFAULT_CONTENT,
  projects: DEFAULT_PROJECTS.map((p, i) => ({ ...p, id: p.slug, order: i + 1 })),
  categories: DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: c.slug, order: i + 1 })),
});

export function ContentProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PublicPayload | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await api<PublicPayload>("GET", "/api/content"));
    } catch (err) {
      console.warn("Contenu indisponible, affichage du contenu d’origine.", err);
      setData((prev) => prev ?? fallback());
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<ContentState | null>(() => (data ? { ...data, reload } : null), [data, reload]);
  if (!value) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite(): ContentState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite doit être utilisé dans <ContentProvider>.");
  return v;
}
