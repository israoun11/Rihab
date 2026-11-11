import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { fill } from "@rihab/shared";
import { useSite } from "../content/ContentContext";
import { Arrow } from "./Arrow";
import { Inline } from "./Rich";

type Key = "nom" | "email" | "telephone" | "type" | "localisation" | "message";
const ORDER: Key[] = ["nom", "email", "telephone", "type", "localisation", "message"];
type Values = Record<Key, string>;

/**
 * Enquiry form, same behaviour as the original: validates, then prepares the
 * message for e-mail or WhatsApp and says so honestly (nothing is sent by the site).
 */
export function EnquiryForm({ fid = "f" }: { fid?: string }) {
  const { content } = useSite();
  const f = content.contact.form;
  const er = content.contact.errors;
  const { email: EMAIL, whatsapp } = content.site.contact;
  const location = useLocation();

  const [values, setValues] = useState<Values>({ nom: "", email: "", telephone: "", type: "", localisation: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [summary, setSummary] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState<{ mail: string; wa: string; text: string } | null>(null);
  const [copyLabel, setCopyLabel] = useState(f.copyButton);
  const [copyVisible, setCopyVisible] = useState(false);

  const refs = useRef<Partial<Record<Key, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const handoffRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLTextAreaElement>(null);

  const rules = useMemo<Record<Key, (v: string) => string>>(
    () => ({
      nom: (v) => (v.trim().length >= 2 ? "" : er.name),
      email: (v) => (!v.trim() ? er.emailMissing : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : er.emailInvalid),
      telephone: (v) => (!v.trim() || /^[+\d][\d\s().-]{6,}$/.test(v.trim()) ? "" : er.phone),
      type: (v) => (v ? "" : er.type),
      localisation: (v) => (v.trim() ? "" : er.location),
      message: (v) => (v.trim().length >= 10 ? "" : er.message),
    }),
    [er],
  );

  // Preset from "Être informé des prochaines formations" links.
  useEffect(() => {
    const preset = (new URLSearchParams(location.search).get("sujet") ?? "").toLowerCase();
    if (preset === "formations" || /formation/i.test(location.hash)) {
      const opt = f.typeOptions.find((o) => /formation/i.test(o));
      setValues((v) => ({ ...v, type: opt ?? v.type, message: v.message || f.formationPreset }));
    }
  }, [location.search, location.hash, f.typeOptions, f.formationPreset]);

  useEffect(() => setCopyLabel(f.copyButton), [f.copyButton]);

  const check = (key: Key, value = values[key]) => {
    const err = rules[key](value);
    setErrors((e) => ({ ...e, [key]: err }));
    return err;
  };

  const onChange = (key: Key, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) check(key, value);
  };
  const onBlur = (key: Key) => {
    if (values[key] || errors[key]) check(key);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = ORDER.map((k) => ({ k, err: check(k) })).filter((x) => x.err);
    if (found.length) {
      setSummary(found.map((x) => x.err));
      requestAnimationFrame(() => {
        summaryRef.current?.focus();
        const first = found[0];
        if (first) refs.current[first.k]?.focus();
      });
      return;
    }
    setSummary(null);
    setBusy(true);
    const isFormation = /formation/i.test(values.type);
    const subject = isFormation ? f.mailSubjectFormation : fill(f.mailSubjectProject, { type: values.type });
    const body =
      `${f.name} : ${values.nom.trim()}\n` +
      `${f.email} : ${values.email.trim()}\n` +
      (values.telephone.trim() ? `${f.phone} : ${values.telephone.trim()}\n` : "") +
      `${f.type} : ${values.type}\n` +
      `${f.location} : ${values.localisation.trim()}\n\n` +
      values.message.trim();
    const mail = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const wa = `https://wa.me/${whatsapp}?text=${encodeURIComponent(subject + "\n\n" + body)}`;
    window.setTimeout(() => {
      setHandoff({ mail, wa, text: `Objet : ${subject}\n\n${body}` });
      setBusy(false);
      requestAnimationFrame(() => handoffRef.current?.focus());
    }, 450);
  };

  const onCopy = () => {
    const ta = copyRef.current;
    if (!ta || !handoff) return;
    const fallback = () => {
      setCopyVisible(true);
      requestAnimationFrame(() => {
        ta.focus();
        ta.select();
      });
      setCopyLabel(f.copyFallback);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(handoff.text).then(() => setCopyLabel(f.copyDone), fallback);
    else fallback();
  };

  const field = (
    key: Key,
    label: string,
    control: "input" | "select" | "textarea",
    opts: { typ?: string; full?: boolean; optional?: boolean; auto?: string; inputMode?: "email" | "tel"; placeholder?: string } = {},
  ) => {
    const id = `${fid}-${key}`;
    const common = {
      id,
      name: key,
      "aria-describedby": `${id}-error`,
      "aria-invalid": errors[key] === undefined ? undefined : errors[key] ? ("true" as const) : ("false" as const),
      ...(opts.optional ? {} : { "aria-required": "true" as const }),
      value: values[key],
      onBlur: () => onBlur(key),
    };
    return (
      <div className={`field${opts.full ? " field--full" : ""}`}>
        <label htmlFor={id}>
          {label}
          {opts.optional && (
            <>
              {" "}
              <span className="opt">{f.optional}</span>
            </>
          )}
        </label>
        {control === "input" && (
          <input
            {...common}
            ref={(el) => {
              refs.current[key] = el;
            }}
            type={opts.typ ?? "text"}
            autoComplete={opts.auto}
            inputMode={opts.inputMode}
            placeholder={opts.placeholder}
            onChange={(e) => onChange(key, e.target.value)}
          />
        )}
        {control === "select" && (
          <select
            {...common}
            ref={(el) => {
              refs.current[key] = el;
            }}
            onChange={(e) => onChange(key, e.target.value)}
          >
            <option value="">{f.typePlaceholder}</option>
            {f.typeOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        )}
        {control === "textarea" && (
          <textarea
            {...common}
            ref={(el) => {
              refs.current[key] = el;
            }}
            rows={6}
            placeholder={opts.placeholder}
            onChange={(e) => onChange(key, e.target.value)}
          />
        )}
        <p className="field__error" id={`${id}-error`} aria-live="polite">
          {errors[key] ?? ""}
        </p>
      </div>
    );
  };

  return (
    <form className="form" data-enquiry noValidate aria-label={f.ariaLabel} id="formulaire" onSubmit={onSubmit}>
      <div className="form__summary" role="alert" tabIndex={-1} hidden={!summary} ref={summaryRef}>
        {summary && (
          <>
            <strong>{summary.length > 1 ? fill(er.summaryMany, { n: summary.length }) : er.summaryOne}</strong> {summary.join(" ")}
          </>
        )}
      </div>
      {field("nom", f.name, "input", { auto: "name" })}
      {field("email", f.email, "input", { typ: "email", auto: "email", inputMode: "email" })}
      {field("telephone", f.phone, "input", { typ: "tel", optional: true, auto: "tel", inputMode: "tel" })}
      {field("type", f.type, "select")}
      {field("localisation", f.location, "input", { full: true, auto: "address-level2", placeholder: f.locationPlaceholder })}
      {field("message", f.message, "textarea", { full: true, placeholder: f.messagePlaceholder })}
      <div className="form__foot">
        <p className="form__note">
          <Inline text={fill(f.note, { email: EMAIL })} />
        </p>
        <div>
          <button className="btn" type="submit" disabled={busy} aria-disabled={busy || undefined}>
            <span>{busy ? f.submitting : f.submit}</span> <Arrow />
          </button>
        </div>
      </div>
      <div className="handoff" tabIndex={-1} hidden={!handoff} role="status" ref={handoffRef}>
        <h3>{f.handoffTitle}</h3>
        <p>{f.handoffText}</p>
        <div className="btn-row">
          <a className="btn" data-mail href={handoff?.mail ?? `mailto:${EMAIL}`}>
            {f.handoffMail} <Arrow />
          </a>
          <a className="btn btn--ghost" data-wa href={handoff?.wa ?? `https://wa.me/${whatsapp}`} target="_blank" rel="noopener">
            {f.handoffWhatsapp}
          </a>
        </div>
        <div className="copy-row">
          <span>{f.copyBefore}</span>
          <button className="copy-btn" type="button" onClick={onCopy}>
            {copyLabel}
          </button>
          <span>{fill(f.copyAfter, { email: EMAIL })}</span>
        </div>
        <label className="sr-only" htmlFor={`${fid}-copy`}>
          {f.copyTextLabel}
        </label>
        <textarea id={`${fid}-copy`} className="sr-only" readOnly hidden={!copyVisible} ref={copyRef} value={handoff?.text ?? ""} />
      </div>
    </form>
  );
}
