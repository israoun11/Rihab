import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
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

// The dashboard is a separate bundle, never downloaded by visitors of the public site.
const AdminApp = lazy(() => import("./admin/AdminApp"));

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
          <ContentProvider>
            <SiteLayout />
          </ContentProvider>
        }
      >
        <Route index element={<Home />} />
        <Route path="a-propos" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="projets" element={<Projects />} />
        <Route path="projets/:slug" element={<ProjectDetail />} />
        <Route path="formations" element={<Formations />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
