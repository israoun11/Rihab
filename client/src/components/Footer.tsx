import { Link } from "react-router-dom";
import { useSite } from "../content/ContentContext";
import { navItems } from "./navItems";

export function Footer() {
  const { content } = useSite();
  const { footer, nav, contact, identity, social } = content.site;
  const telHref = `tel:${contact.phone.replace(/[^\d+]/g, "")}`;
  return (
    <footer className="footer">
      <div className="wrap grid">
        <div className="footer__brand">
          <p className="footer__name">{identity.name}</p>
          <p className="label label--plain">{footer.tagline}</p>
          <p>{footer.text}</p>
        </div>
        <div className="footer__col fc-nav">
          <h2>{footer.navTitle}</h2>
          {navItems(nav, true).map((it) => (
            <Link key={it.key} to={it.to}>
              {it.label}
            </Link>
          ))}
        </div>
        <div className="footer__col fc-soc">
          <h2>{footer.socialTitle}</h2>
          {social.links.map((s) => (
            <a key={s.url + s.label} href={s.url} target="_blank" rel="noopener">
              {s.label}
              <span className="sr-only">{footer.newTab}</span>
            </a>
          ))}
        </div>
        <div className="footer__col fc-contact">
          <h2>{footer.contactTitle}</h2>
          <span className="meta">{contact.location}</span>
          <a href={telHref}>{contact.phone}</a>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </div>
        <div className="footer__base">
          <span>
            © <span>{new Date().getFullYear()}</span> {identity.name}
          </span>
          <span>{footer.coords}</span>
        </div>
      </div>
    </footer>
  );
}
