import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSite } from "../content/ContentContext";
import { Arrow } from "./Arrow";
import { currentNavKey, navItems } from "./navItems";

const cur = (on: boolean) => (on ? ({ "aria-current": "page" } as const) : {});

export function Nav({ solid }: { solid: boolean }) {
  const { content } = useSite();
  const { nav, identity, contact } = content.site;
  const { pathname, hash } = useLocation();
  const current = currentNavKey(pathname, hash);

  /* ---------- Sticky navigation (transparent over the hero) ---------- */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  /* ---------- Mobile menu with focus management ---------- */
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(true);

  const openMenu = () => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    restoreFocus.current = true;
    setMounted(true);
    requestAnimationFrame(() => {
      setOpen(true);
      window.setTimeout(() => closeRef.current?.focus(), 30);
    });
  };
  const closeMenu = useCallback((restore = true) => {
    restoreFocus.current = restore;
    setOpen(false);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    if (open) return;
    const t = window.setTimeout(() => setMounted(false), 340);
    if (restoreFocus.current && lastFocus.current) lastFocus.current.focus();
    lastFocus.current = null;
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => () => document.body.classList.remove("menu-open"), []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 981px)");
    const onChange = (m: MediaQueryListEvent) => {
      if (m.matches) closeMenu(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [closeMenu]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeMenu();
      return;
    }
    if (e.key !== "Tab" || !menuRef.current) return;
    const f = Array.from(menuRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  const desktop = navItems(nav, false);
  const mobile = navItems(nav, true);
  const telHref = `tel:${contact.phone.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <header className={`nav${solid ? " nav--solid" : ""}${!solid && scrolled ? " is-solid" : ""}`}>
        <div className="wrap nav__inner">
          <Link className="wordmark" to="/" aria-label={identity.homeLinkLabel}>
            {identity.name}
            <i aria-hidden="true"></i>
          </Link>
          <nav className="nav__links" aria-label="Navigation principale">
            {desktop.map((it) => (
              <Link key={it.key} to={it.to} {...cur(current === it.key)}>
                {it.label}
              </Link>
            ))}
            <Link className="btn" to="/contact" {...cur(current === "contact")}>
              {nav.cta}
            </Link>
          </nav>
          <button ref={toggleRef} className="nav__toggle" type="button" aria-expanded={open} aria-controls="menu" onClick={openMenu}>
            <span>{nav.menu}</span>
            <span className="nav__toggle-icon" aria-hidden="true"></span>
          </button>
        </div>
      </header>
      <div
        ref={menuRef}
        className={`menu${open ? " is-open" : ""}`}
        id="menu"
        role="dialog"
        aria-modal="true"
        aria-label={nav.menu}
        hidden={!mounted}
        inert={!open}
        onKeyDown={onMenuKey}
      >
        <div className="wrap menu__head">
          <Link className="wordmark" to="/" onClick={() => closeMenu(false)}>
            {identity.name}
            <i aria-hidden="true"></i>
          </Link>
          <button ref={closeRef} className="menu__close" type="button" onClick={() => closeMenu()}>
            <span>{nav.close}</span>
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
        <div className="wrap menu__body">
          <nav aria-label="Navigation mobile">
            <ul className="menu__list">
              {mobile.map((it, i) => (
                <li key={it.key}>
                  <Link to={it.to} onClick={() => closeMenu(false)} {...cur(current === it.key)}>
                    {it.label}
                    <small>{String(i + 1).padStart(2, "0")}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link className="btn" to="/contact" onClick={() => closeMenu(false)}>
            {nav.cta} <Arrow />
          </Link>
          <div className="menu__foot">
            <span>{contact.location}</span>
            <a href={telHref}>{contact.phone}</a>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </div>
        </div>
      </div>
    </>
  );
}
