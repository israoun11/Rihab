import { useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSite } from "../content/ContentContext";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function SiteLayout() {
  const { content } = useSite();
  const { pathname, hash, key } = useLocation();

  // New page: start at the top. Same page with a #section: scroll to it.
  useLayoutEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, key]);

  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const raf = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash, key]);

  return (
    <>
      <a className="skip-link" href="#contenu">
        {content.site.identity.skipLink}
      </a>
      <Nav solid={pathname !== "/"} />
      <Outlet />
      <Footer />
    </>
  );
}
