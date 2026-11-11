import { useState } from "react";
import { useSite } from "../content/ContentContext";
import { Arrow } from "./Arrow";
import { Lines } from "./Rich";
import { EnquiryForm } from "./EnquiryForm";

export function ContactSection({ headingTag: H = "h2" }: { headingTag?: "h1" | "h2" }) {
  const { content } = useSite();
  const c = content.contact.intro;
  const { email, phone, whatsapp, location } = content.site.contact;
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard.writeText(email).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => undefined,
    );
  };

  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="wrap grid">
        <H className="display" id="contact-title" data-in>
          <Lines text={c.title} />
        </H>
        <div className="contact__intro" data-in>
          <p>{c.text}</p>
          <dl className="coords">
            <div>
              <dt>{c.studioLabel}</dt>
              <dd>{location}</dd>
            </div>
            <div>
              <dt>{c.phoneLabel}</dt>
              <dd>
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
              </dd>
            </div>
            <div>
              <dt>{c.emailLabel}</dt>
              <dd>
                <a href={`mailto:${email}`}>{email}</a>{" "}
                <button className="copy-btn" type="button" onClick={copyEmail}>
                  {copied ? c.copied : c.copy}
                </button>
              </dd>
            </div>
          </dl>
          <div className="btn-row">
            <a className="btn" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">
              {c.whatsapp} <Arrow />
            </a>
            <a className="link" href={`mailto:${email}`}>
              <span>{c.emailLink}</span> <Arrow />
            </a>
          </div>
        </div>
        <div className="contact__form" data-in>
          <EnquiryForm />
        </div>
      </div>
    </section>
  );
}
