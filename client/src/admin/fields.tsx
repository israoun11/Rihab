import { useId, useState } from "react";
import type { FieldDef, ImageValue, LeafFieldDef, ListFieldDef } from "@rihab/shared";
import { MediaPicker } from "./MediaPicker";

type Dict = Record<string, unknown>;

/* ---------- Text ---------- */
export function TextField({
  label,
  value,
  onChange,
  multiline,
  help,
  optional,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  help?: string;
  optional?: boolean;
  invalid?: boolean;
}) {
  const id = useId();
  const rows = Math.min(12, Math.max(3, value.split("\n").length + 1, Math.ceil(value.length / 70)));
  return (
    <div className="a-field">
      <label className="a-label" htmlFor={id}>
        {label}
        {optional && <span className="a-opt"> (facultatif)</span>}
      </label>
      {multiline ? (
        <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} />
      ) : (
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} />
      )}
      {help && <p className="a-help">{help}</p>}
    </div>
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
  value: ImageValue | null;
  onChange: (v: ImageValue | null) => void;
  optional?: boolean;
  help?: string;
  /** Custom remove action (e.g. remove from a gallery). */
  onRemove?: () => void;
  extraActions?: React.ReactNode;
}) {
  const [picking, setPicking] = useState(false);
  const altId = useId();
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
                Description de l’image (texte alternatif, légende)
              </label>
              <input id={altId} type="text" value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
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
export function StringListField({ label, itemLabel, value, onChange }: { label: string; itemLabel: string; value: string[]; onChange: (v: string[]) => void }) {
  const set = (i: number, v: string) => onChange(value.map((x, j) => (j === i ? v : x)));
  return (
    <fieldset className="a-field a-fieldset">
      <legend className="a-label">{label}</legend>
      <ol className="a-strings">
        {value.map((v, i) => (
          <li key={i} className="a-strings__row">
            <input type="text" value={v} aria-label={`${itemLabel} ${i + 1}`} onChange={(e) => set(i, e.target.value)} />
            <MoveButtons index={i} length={value.length} onMove={(from, to) => onChange(move(value, from, to))} label={itemLabel} />
            <button type="button" className="a-icon-btn a-btn--danger" aria-label={`Supprimer ${itemLabel.toLowerCase()} ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
              ×
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onChange([...value, ""])}>
        + Ajouter : {itemLabel.toLowerCase()}
      </button>
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
                  onClick={() => window.confirm(`Supprimer « ${def.itemLabel} ${i + 1} » ?`) && onChange(value.filter((_, j) => j !== i))}
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
      return "";
    case "url":
      return "https://";
    case "image":
      return null;
    case "stringList":
      return [];
  }
}

export function LeafEditor({ def, value, onChange }: { def: LeafFieldDef; value: unknown; onChange: (v: unknown) => void }) {
  switch (def.type) {
    case "text":
      return (
        <TextField
          label={def.label}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          multiline={def.multiline}
          help={def.help}
          optional={def.optional}
        />
      );
    case "url":
      return <TextField label={def.label} value={typeof value === "string" ? value : ""} onChange={onChange} help={def.help} />;
    case "image":
      return (
        <ImageField
          label={def.label}
          ratio={def.ratio}
          value={(value as ImageValue | null) ?? null}
          onChange={onChange}
          optional={def.optional}
          help={def.help}
        />
      );
    case "stringList":
      return <StringListField label={def.label} itemLabel={def.itemLabel} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
  }
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
