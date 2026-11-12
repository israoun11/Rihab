import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { localizePath, splitLocalePath } from "@rihab/shared";
import { ContentProvider } from "./content/ContentContext";
import { SiteLayout } from "./components/SiteLayout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Services } from "./pages/Services";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Formations } from "./pages/Formations";
import { Contact } from "./pages/Contact";
import { NotFound } from "./pages/NotFound";
import { storedLang } from "./i18n/storage";

// The dashboard is a separate bundle, never downloaded by visitors of the public site.
const AdminApp = lazy(() => import("./admin/AdminApp"));

/** The pages of the site; mounted at / (French), /ar (Arabic) and /en (English). */
const pages = (prefix: string) => [
  <Route key={`${prefix}home`} index element={<Home />} />,
  <Route key={`${prefix}about`} path="a-propos" element={<About />} />,
  <Route key={`${prefix}services`} path="services" element={<Services />} />,
  <Route key={`${prefix}projects`} path="projets" element={<Projects />} />,
  <Route key={`${prefix}project`} path="projets/:slug" element={<ProjectDetail />} />,
  <Route key={`${prefix}formations`} path="formations" element={<Formations />} />,
  <Route key={`${prefix}contact`} path="contact" element={<Contact />} />,
  <Route key={`${prefix}404`} path="*" element={<NotFound />} />,
];

export function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={null}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route
        element={
          <PreferredLanguage>
            <ContentProvider>
              <SiteLayout />
            </ContentProvider>
          </PreferredLanguage>
        }
      >
        <Route path="ar">{pages("ar-")}</Route>
        <Route path="en">{pages("en-")}</Route>
        {pages("")}
      </Route>
    </Routes>
  );
}

/**
 * A visitor who chose Arabic or English with the language switcher and opens a
 * French address (bookmark, shared link to the home page…) gets the page in
 * their language. Explicit /ar and /en addresses are always respected.
 */
function PreferredLanguage({ children }: { children: React.ReactNode }) {
  const { pathname, search, hash } = useLocation();
  const { lang, path } = splitLocalePath(pathname);
  const pref = storedLang();
  const redirect = lang === "fr" && pref && pref !== "fr" ? localizePath(path, pref) + search + hash : null;
  if (redirect) return <Navigate to={redirect} replace />;
  return <>{children}</>;
}
