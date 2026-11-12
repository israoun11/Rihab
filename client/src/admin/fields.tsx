import { useId, useState } from "react";
import {
  LOCALE_INFO,
  isDict,
  isTranslatable,
  normalizeLayout,
  type FieldDef,
  type LayoutFieldDef,
  type LayoutItem,
  type LeafFieldDef,
  type ListFieldDef,
  type Locale,
  type LocalizedText,
  type RawImage,
} from "@rihab/shared";
import { MediaPicker } from "./MediaPicker";
import { LANG_IN, useEditLang } from "./editLang";

type Dict = Record<string, unknown>;

const dirOf = (lang: Locale) => LOCALE_INFO[lang].dir;
const asText = (v: unknown): LocalizedText => (typeof v === "string" ? { fr: v } : isDict(v) && typeof v.fr === "string" ? (v as LocalizedText) : { fr: "" });
const filled = (s: unknown) => typeof s === "string" && s.trim().length > 0;

/* ---------- Text (one language) ---------- */
export function TextField({
  label,
  value,
  onChange,
  multiline,
  help,
  optional,
  invalid,
  dir,
  placeholder,
  note,
  badge,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  help?: string;
  optional?: boolean;
  invalid?: boolean;
  dir?: "ltr" | "rtl";
  placeholder?: string;
  /** Shown under the input (e.g. the French reference text). */
  note?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const id = useId();
  const rows = Math.min(12, Math.max(3, value.split("\n").length + 1, Math.ceil(value.length / 70)));
  return (
    <div className="a-field">
      <label className="a-label" htmlFor={id}>
        {label}
        {optional && <span className="a-opt"> (facultatif)</span>}
        {badge}
      </label>
      {multiline ? (
        <textarea id={id} rows={rows} value={value} dir={dir} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} />
      ) : (
        <input id={id} type="text" value={value} dir={dir} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} />
      )}
      {note}
      {help && <p className="a-help">{help}</p>}
    </div>
  );
}

/**
 * Translatable text: edits the language chosen in « Langue d’édition ». In
 * Arabic or English, the French text is shown as a reference, and an empty
 * translation is flagged (the French text is shown on the site meanwhile).
 */
export function LocalizedTextField({
  label,
  value,
  onChange,
  multiline,
  help,
  optional,
}: {
  label: string;
  value: unknown;
  onChange: (v: LocalizedText) => void;
  multiline?: boolean;
  help?: string;
  optional?: boolean;
}) {
  const { lang } = useEditLang();
  const v = asText(value);
  const own = (lang === "fr" ? v.fr : v[lang]) ?? "";
  const missing = lang !== "fr" && filled(v.fr) && !filled(own);
  const set = (text: string) => {
    const next: LocalizedText = { ...v };
    if (lang === "fr") next.fr = text;
    else next[lang] = text;
    onChange(next);
  };
  return (
    <TextField
      label={label}
      value={own}
      onChange={set}
      multiline={multiline}
      help={help}
      optional={optional}
      dir={dirOf(lang)}
      placeholder={lang !== "fr" ? v.fr : undefined}
      badge={missing ? <span className="a-pill a-pill--warn a-pill--inline">À traduire</span> : null}
      note={lang !== "fr" && filled(v.fr) ? <p className="a-ref" lang="fr">Français : {v.fr}</p> : null}
    />
  );
}

/* ---------- Image with preview ---------- */
export function ImageField({
  label,
  ratio,
  value,
  onChange,
  optional,
  help,
  onRemove,
  extraActions,
}: {
  label: string;
  ratio: string;
  value: RawImage | null;
  onChange: (v: RawImage | null) => void;
  optional?: boolean;
  help?: string;
  /** Custom remove action (e.g. remove from a gallery). */
  onRemove?: () => void;
  extraActions?: React.ReactNode;
}) {
  const [picking, setPicking] = useState(false);
  const { lang } = useEditLang();
  const altId = useId();
  const alt = value ? asText(value.alt) : { fr: "" };
  const ownAlt = (lang === "fr" ? alt.fr : alt[lang]) ?? "";
  const setAlt = (text: string) => value && onChange({ ...value, alt: { ...alt, [lang]: text } as LocalizedText });
  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <div className="a-image">
        <div className="a-image__preview" style={{ aspectRatio: ratio }}>
          {value ? <img src={value.src} alt="" /> : <span className="a-image__empty">Aucune image</span>}
          {value?.demo && <span className="a-badge">Démonstration</span>}
        </div>
        <div className="a-image__side">
          {value && (
            <div className="a-field">
              <label className="a-label a-label--sm" htmlFor={altId}>
                Description de l’image (texte alternatif, légende) {LANG_IN[lang]}
                {lang !== "fr" && filled(alt.fr) && !filled(ownAlt) && <span className="a-pill a-pill--warn a-pill--inline">À traduire</span>}
              </label>
              <input id={altId} type="text" value={ownAlt} dir={dirOf(lang)} placeholder={lang !== "fr" ? alt.fr : undefined} onChange={(e) => setAlt(e.target.value)} />
              {lang !== "fr" && filled(alt.fr) && (
                <p className="a-ref" lang="fr">
                  Français : {alt.fr}
                </p>
              )}
            </div>
          )}
          <p className="a-help">
            {value ? `Fichier : ${value.width} × ${value.height} px. ` : ""}
            Cadrage sur le site : {ratio.replace(/\s/g, "")}, l’image est recadrée sans déformation.
            {help ? ` ${help}` : ""}
          </p>
          <div className="a-row">
            <button type="button" className="a-btn a-btn--sm" onClick={() => setPicking(true)}>
              {value ? "Remplacer l’image" : "Ajouter une image"}
            </button>
            {onRemove ? (
              <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--danger" onClick={onRemove}>
                Retirer
              </button>
            ) : (
              optional &&
              value && (
                <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--danger" onClick={() => onChange(null)}>
                  Retirer l’image
                </button>
              )
            )}
            {extraActions}
          </div>
        </div>
      </div>
      {picking && <MediaPicker ratio={ratio} current={value} onPick={(img) => onChange(img)} onClose={() => setPicking(false)} />}
    </div>
  );
}

/* ---------- List of strings ---------- */
export function StringListField({
  label,
  itemLabel,
  value,
  onChange,
  dir,
  note,
  badge,
}: {
  label: string;
  itemLabel: string;
  value: string[];
  onChange: (v: string[]) => void;
  dir?: "ltr" | "rtl";
  note?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const set = (i: number, v: string) => onChange(value.map((x, j) => (j === i ? v : x)));
  return (
    <fieldset className="a-field a-fieldset">
      <legend className="a-label">
        {label}
        {badge}
      </legend>
      <ol className="a-strings">
        {value.map((v, i) => (
          <li key={i} className="a-strings__row">
            <input type="text" value={v} dir={dir} aria-label={`${itemLabel} ${i + 1}`} onChange={(e) => set(i, e.target.value)} />
            <MoveButtons index={i} length={value.length} onMove={(from, to) => onChange(move(value, from, to))} label={itemLabel} />
            <button type="button" className="a-icon-btn a-btn--danger" aria-label={`Supprimer ${itemLabel.toLowerCase()} ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
              ×
            </button>
          </li>
        ))}
      </ol>
      {note}
      <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onChange([...value, ""])}>
        + Ajouter : {itemLabel.toLowerCase()}
      </button>
    </fieldset>
  );
}

/** Translatable list of strings: one list per language. */
function LocalizedStringListField({ label, itemLabel, value, onChange }: { label: string; itemLabel: string; value: unknown; onChange: (v: unknown) => void }) {
  const { lang } = useEditLang();
  const v: Record<string, string[]> = Array.isArray(value) ? { fr: value as string[] } : isDict(value) ? (value as Record<string, string[]>) : { fr: [] };
  const fr = v.fr ?? [];
  const own = v[lang] ?? [];
  const missing = lang !== "fr" && fr.length > 0 && !(own.length > 0 && own.every(filled));
  return (
    <StringListField
      label={label}
      itemLabel={itemLabel}
      value={own}
      dir={dirOf(lang)}
      onChange={(list) => onChange({ ...v, [lang]: list })}
      badge={missing ? <span className="a-pill a-pill--warn a-pill--inline">À traduire</span> : null}
      note={
        lang !== "fr" && fr.length > 0 ? (
          <div className="a-ref" lang="fr">
            Français : {fr.join(" · ")}
            {own.length === 0 && (
              <>
                {" "}
                <button type="button" className="a-link-btn" onClick={() => onChange({ ...v, [lang]: [...fr] })}>
                  Partir de la liste française
                </button>
              </>
            )}
          </div>
        ) : null
      }
    />
  );
}

/* ---------- Order and visibility of blocks ---------- */
export function LayoutField({ def, value, onChange }: { def: LayoutFieldDef; value: unknown; onChange: (v: LayoutItem[]) => void }) {
  const items = normalizeLayout(def.items, value);
  const labelOf = (k: string) => def.items.find((i) => i.key === k)?.label ?? k;
  return (
    <fieldset className="a-field a-fieldset">
      <legend className="a-label">{def.label}</legend>
      <ol className="a-layout">
        {items.map((it, i) => (
          <li key={it.key} className={`a-layout__row${it.visible ? "" : " is-hidden"}`}>
            <label className="a-check">
              <input type="checkbox" checked={it.visible} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x)))} />
              <span>{labelOf(it.key)}</span>
            </label>
            <span className="a-help">{it.visible ? "Affichée" : "Masquée"}</span>
            <MoveButtons index={i} length={items.length} onMove={(from, to) => onChange(move(items, from, to))} label={labelOf(it.key)} />
          </li>
        ))}
      </ol>
      {def.help && <p className="a-help">{def.help}</p>}
    </fieldset>
  );
}

/* ---------- List of objects ---------- */
export function ListField({ def, value, onChange }: { def: ListFieldDef; value: Dict[]; onChange: (v: Dict[]) => void }) {
  const setItem = (i: number, key: string, v: unknown) => onChange(value.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
  const empty = (): Dict => Object.fromEntries(Object.entries(def.fields).map(([k, f]) => [k, emptyValue(f)]));
  return (
    <fieldset className="a-field a-fieldset">
      <legend className="a-label">{def.label}</legend>
      <div className="a-items">
        {value.map((item, i) => (
          <div className="a-item" key={i}>
            <div className="a-item__head">
              <span>
                {def.itemLabel} {i + 1}
              </span>
              <div className="a-row">
                <MoveButtons index={i} length={value.length} onMove={(from, to) => onChange(move(value, from, to))} label={def.itemLabel} />
                <button
                  type="button"
                  className="a-btn a-btn--ghost a-btn--sm a-btn--danger"
                  onClick={() => window.confirm(`Supprimer « ${def.itemLabel} ${i + 1} » (dans toutes les langues) ?`) && onChange(value.filter((_, j) => j !== i))}
                >
                  Supprimer
                </button>
              </div>
            </div>
            {Object.entries(def.fields).map(([key, f]) => (
              <LeafEditor key={key} def={f} value={item[key]} onChange={(v) => setItem(i, key, v)} />
            ))}
          </div>
        ))}
      </div>
      <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onChange([...value, empty()])}>
        + Ajouter : {def.itemLabel.toLowerCase()}
      </button>
    </fieldset>
  );
}

function emptyValue(f: LeafFieldDef): unknown {
  switch (f.type) {
    case "text":
      return isTranslatable(f) ? { fr: "" } : "";
    case "url":
      return "https://";
    case "image":
      return null;
    case "stringList":
      return isTranslatable(f) ? { fr: [] } : [];
    case "color":
      return "#000000";
    case "select":
      return f.options[0]?.value ?? "";
    case "boolean":
      return true;
    case "layout":
      return normalizeLayout(f.items, []);
  }
}

export function LeafEditor({ def, value, onChange }: { def: LeafFieldDef; value: unknown; onChange: (v: unknown) => void }) {
  switch (def.type) {
    case "text":
      if (isTranslatable(def)) {
        return <LocalizedTextField label={def.label} value={value} onChange={onChange} multiline={def.multiline} help={def.help} optional={def.optional} />;
      }
      return (
        <TextField
          label={def.label}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          multiline={def.multiline}
          help={`${def.help ? def.help + " " : ""}Identique dans toutes les langues.`}
          optional={def.optional}
        />
      );
    case "url":
      return <TextField label={def.label} value={typeof value === "string" ? value : ""} onChange={onChange} help={def.help} dir="ltr" />;
    case "image":
      return <ImageField label={def.label} ratio={def.ratio} value={(value as RawImage | null) ?? null} onChange={onChange} optional={def.optional} help={def.help} />;
    case "stringList":
      if (isTranslatable(def)) return <LocalizedStringListField label={def.label} itemLabel={def.itemLabel} value={value} onChange={onChange} />;
      return <StringListField label={def.label} itemLabel={def.itemLabel} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
    case "color":
      return <ColorField label={def.label} value={typeof value === "string" ? value : "#000000"} onChange={onChange} help={def.help} />;
    case "select":
      return <SelectField label={def.label} value={typeof value === "string" ? value : ""} options={def.options} onChange={onChange} help={def.help} />;
    case "boolean":
      return <BooleanField label={def.label} value={value !== false} onChange={onChange} help={def.help} />;
    case "layout":
      return <LayoutField def={def} value={value} onChange={onChange} />;
  }
}

function ColorField({ label, value, onChange, help }: { label: string; value: string; onChange: (v: string) => void; help?: string }) {
  const id = useId();
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className="a-field">
      <label className="a-label" htmlFor={id}>
        {label}
      </label>
      <div className="a-row a-color">
        <input type="color" value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label={`${label} (sélecteur)`} />
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value.trim())} aria-invalid={!valid || undefined} maxLength={7} dir="ltr" />
      </div>
      {help && <p className="a-help">{help}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  help,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
  help?: string;
}) {
  const id = useId();
  return (
    <div className="a-field">
      <label className="a-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help && <p className="a-help">{help}</p>}
    </div>
  );
}

function BooleanField({ label, value, onChange, help }: { label: string; value: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <div className="a-field">
      <label className="a-check">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
      {help && <p className="a-help">{help}</p>}
    </div>
  );
}

export function FieldEditor({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  if (def.type === "list") return <ListField def={def} value={Array.isArray(value) ? (value as Dict[]) : []} onChange={onChange} />;
  return <LeafEditor def={def} value={value} onChange={onChange} />;
}

/* ---------- Reorder helpers ---------- */
export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const copy = list.slice();
  const [x] = copy.splice(from, 1);
  copy.splice(to, 0, x as T);
  return copy;
}

export function MoveButtons({ index, length, onMove, label }: { index: number; length: number; onMove: (from: number, to: number) => void; label: string }) {
  return (
    <>
      <button type="button" className="a-icon-btn" aria-label={`Monter ${label.toLowerCase()} ${index + 1}`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        ↑
      </button>
      <button
        type="button"
        className="a-icon-btn"
        aria-label={`Descendre ${label.toLowerCase()} ${index + 1}`}
        disabled={index === length - 1}
        onClick={() => onMove(index, index + 1)}
      >
        ↓
      </button>
    </>
  );
}
