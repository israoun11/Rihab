import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CONTENT_SCHEMA, type PageDef, type SectionDef, type SiteContent } from "@rihab/shared";
import { ApiError } from "../api/http";
import { adminApi } from "./api";
import { FieldEditor } from "./fields";
import { ErrorList, Spinner, useToast, useUnsavedGuard } from "./ui";

type Dict = Record<string, unknown>;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function PageEditor() {
  const { page = "" } = useParams();
  const def = (CONTENT_SCHEMA as Record<string, PageDef>)[page];
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loadError, setLoadError] = useState("");
  const [dirtySections, setDirtySections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    adminApi
      .content()
      .then(setContent)
      .catch((e: unknown) => setLoadError(e instanceof ApiError ? e.message : "Chargement impossible."));
  }, []);

  useUnsavedGuard(Object.values(dirtySections).some(Boolean));
  useEffect(() => setDirtySections({}), [page]);

  if (!def) return <Navigate to="/admin/pages/home" replace />;
  if (loadError) return <ErrorList title={loadError} items={[]} />;
  if (!content) return <Spinner />;

  const pageData = (content as unknown as Record<string, Dict>)[page] ?? {};
  return (
    <div className="a-page">
      <header className="a-page__head">
        <div>
          <p className="a-eyebrow">Pages</p>
          <h1>{def.label}</h1>
          {page === "site" && <p className="a-help">Textes présents sur toutes les pages : navigation, pied de page, coordonnées.</p>}
        </div>
        <a className="a-btn a-btn--ghost" href={def.path} target="_blank" rel="noopener">
          Voir sur le site ↗
        </a>
      </header>
      {Object.entries(def.sections).map(([key, s]) => (
        <SectionCard
          key={`${page}.${key}`}
          page={page}
          sectionKey={key}
          def={s}
          saved={(pageData[key] ?? {}) as Dict}
          onSaved={setContent}
          onDirty={(d) => setDirtySections((x) => (x[`${page}.${key}`] === d ? x : { ...x, [`${page}.${key}`]: d }))}
        />
      ))}
      {page === "projects" && (
        <p className="a-help">
          Pour modifier les projets, leurs images et leurs catégories : <Link to="/admin/projets">onglet Projets</Link>.
        </p>
      )}
    </div>
  );
}

function SectionCard({
  page,
  sectionKey,
  def,
  saved,
  onSaved,
  onDirty,
}: {
  page: string;
  sectionKey: string;
  def: SectionDef;
  saved: Dict;
  onSaved: (c: SiteContent) => void;
  onDirty: (dirty: boolean) => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<Dict>(saved);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title: string; items: string[] } | null>(null);
  const dirty = useMemo(() => !same(draft, saved), [draft, saved]);

  // Follow the saved value only when it really changed (saving another section must not discard edits here).
  const savedJson = JSON.stringify(saved);
  useEffect(() => {
    setDraft(JSON.parse(savedJson) as Dict);
  }, [savedJson]);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  const save = async () => {
    setSaving(true);
    setErrors(null);
    try {
      const c = await adminApi.saveSection(page, sectionKey, draft);
      onSaved(c);
      toast("ok", `« ${def.label} » enregistré. Le site est à jour.`);
    } catch (e) {
      if (e instanceof ApiError) setErrors({ title: e.message, items: e.issues.map((i) => labelFor(def, i.path, i.message)) });
      else setErrors({ title: "Enregistrement impossible.", items: [] });
    } finally {
      setSaving(false);
    }
  };

  const restore = async () => {
    if (!window.confirm(`Rétablir le contenu d’origine de « ${def.label} » ? Les modifications enregistrées de cette section seront perdues.`)) return;
    setSaving(true);
    try {
      onSaved(await adminApi.resetSection(page, sectionKey));
      setErrors(null);
      toast("ok", "Contenu d’origine rétabli.");
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Opération impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`a-card${dirty ? " is-dirty" : ""}`} aria-labelledby={`s-${page}-${sectionKey}`}>
      <div className="a-card__head">
        <h2 id={`s-${page}-${sectionKey}`}>{def.label}</h2>
        {dirty && <span className="a-pill">Modifications non enregistrées</span>}
      </div>
      {def.description && <p className="a-help">{def.description}</p>}
      {errors && <ErrorList title={errors.title} items={errors.items} />}
      <div className="a-card__body">
        {Object.entries(def.fields).map(([key, f]) => (
          <FieldEditor key={key} def={f} value={draft[key]} onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))} />
        ))}
      </div>
      <div className="a-card__foot">
        <button type="button" className="a-link-btn" onClick={restore} disabled={saving}>
          Rétablir le contenu d’origine
        </button>
        <div className="a-row">
          <button type="button" className="a-btn a-btn--ghost" disabled={!dirty || saving} onClick={() => (setDraft(saved), setErrors(null))}>
            Annuler
          </button>
          <button type="button" className="a-btn a-btn--primary" disabled={!dirty || saving} onClick={save}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Turns "items.2.title" into "Étapes › Étape 3 › Titre : message". */
function labelFor(def: SectionDef, path: string, message: string): string {
  const parts = path.split(".");
  const field = parts[0] ? def.fields[parts[0]] : undefined;
  if (!field) return message;
  const labels = [field.label];
  if (field.type === "list" && parts[1] !== undefined) {
    labels.push(`${field.itemLabel} ${Number(parts[1]) + 1}`);
    const sub = parts[2] ? field.fields[parts[2]] : undefined;
    if (sub) labels.push(sub.label);
  } else if (field.type === "stringList" && parts[1] !== undefined) {
    labels.push(`${field.itemLabel} ${Number(parts[1]) + 1}`);
  }
  return `${labels.join(" › ")} : ${message}`;
}
