import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CONTENT_SCHEMA, PAGE_KEYS } from "@rihab/shared";
import { ApiError } from "../api/http";
import { adminApi } from "./api";
import { Login } from "./Login";
import { PageEditor } from "./PageEditor";
import { ProjectsAdmin } from "./Projects";
import { ProjectEditor } from "./ProjectEditor";
import { MediaLibrary } from "./MediaLibrary";
import { confirmLeave, Spinner, ToastProvider } from "./ui";
import { EditLangProvider } from "./editLang";
import "./admin.css";

export default function AdminApp() {
  const [user, setUser] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    document.title = "Administration · Rihab Baabou";
    // The dashboard is in French, left to right, whatever language the site was showing.
    document.documentElement.lang = "fr";
    document.documentElement.dir = "ltr";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    adminApi
      .me()
      .then((me) => setUser(me.email))
      .catch(() => setUser(null));
    return () => robots.remove();
  }, []);

  // A request rejected because the session expired sends the user back to the login form.
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      if (e.reason instanceof ApiError && e.reason.status === 401) setUser(null);
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  return (
    <div className="admin">
      <ToastProvider>
        <EditLangProvider>
          {user === undefined ? <Spinner /> : user === null ? <Login onLogin={setUser} /> : <Shell email={user} onLogout={() => setUser(null)} />}
        </EditLangProvider>
      </ToastProvider>
    </div>
  );
}

function Shell({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMenuOpen(false), [pathname]);

  const logout = async () => {
    try {
      await adminApi.logout();
    } finally {
      onLogout();
    }
  };

  return (
    <div className={`a-shell${menuOpen ? " is-menu-open" : ""}`}>
      <header className="a-top">
        <span className="a-brand">
          Rihab Baabou<i aria-hidden="true"></i>
        </span>
        <button type="button" className="a-btn a-btn--ghost a-btn--sm a-top__menu" aria-expanded={menuOpen} aria-controls="a-side" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? "Fermer" : "Menu"}
        </button>
      </header>
      <aside className="a-side" id="a-side">
        <span className="a-brand a-side__brand">
          Rihab Baabou<i aria-hidden="true"></i>
        </span>
        <p className="a-side__sub">Administration</p>
        <nav aria-label="Administration">
          <p className="a-side__group">Pages</p>
          {PAGE_KEYS.map((k) => (
            <NavLink key={k} to={`/admin/pages/${k}`} className="a-side__link" onClick={confirmLeave}>
              {CONTENT_SCHEMA[k].label}
            </NavLink>
          ))}
          <p className="a-side__group">Contenu</p>
          <NavLink to="/admin/projets" className="a-side__link" onClick={confirmLeave}>
            Projets & catégories
          </NavLink>
          <NavLink to="/admin/medias" className="a-side__link" onClick={confirmLeave}>
            Médiathèque
          </NavLink>
        </nav>
        <div className="a-side__foot">
          <a href="/" target="_blank" rel="noopener" className="a-side__link">
            Voir le site ↗
          </a>
          <span className="a-help" title={email}>
            {email}
          </span>
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="a-main">
        <Routes>
          <Route index element={<Navigate to="pages/home" replace />} />
          <Route path="pages/:page" element={<PageEditor />} />
          <Route path="projets" element={<ProjectsAdmin />} />
          <Route path="projets/:id" element={<ProjectEditor />} />
          <Route path="medias" element={<MediaLibrary />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
