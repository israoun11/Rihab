import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LOCALES, localizePath, pickText, projectGaps, type CategoryRecord, type Locale, type ProjectInput, type RawImage } from "@rihab/shared";
import { ApiError } from "../api/http";
import { adminApi, slugify } from "./api";
import { ImageField, LocalizedTextField, move, MoveButtons, TextField } from "./fields";
import { EditLangTabs, GapBadge, LANG_IN, useEditLang } from "./editLang";
import { confirmLeave, ErrorList, Spinner, useToast, useUnsavedGuard } from "./ui";

const EMPTY: ProjectInput = {
  slug: "",
  title: { fr: "" },
  place: { fr: "" },
  category: "",
  typeLabel: { fr: "" },
  description: { fr: "" },
  attribution: { fr: "" },
  cover: null as unknown as RawImage,
  images: [],
};

const LABELS: Record<string, string> = {
  slug: "Adresse de la page",
  title: "Nom du projet",
  place: "Lieu",
  category: "Catégorie",
  typeLabel: "Type de projet",
  description: "Description",
  attribution: "Contexte",
  cover: "Image de la carte",
  images: "Images du projet",
};

/** Gallery frames, matching the public project page. */
const ratioFor = (i: number) => (i === 0 ? "16 / 9" : ["16 / 10", "4 / 5", "16 / 10"][(i - 1) % 3] ?? "16 / 10");

export function ProjectEditor() {
  const { id } = useParams();
  const isNew = id === "nouveau";
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const { lang } = useEditLang();
  const [saved, setSaved] = useState<ProjectInput | null>(isNew ? EMPTY : null);
  const [draft, setDraft] = useState<ProjectInput>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title: string; items: string[] } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cats, projects] = await Promise.all([adminApi.categories(), isNew ? Promise.resolve([]) : adminApi.projects()]);
        if (!alive) return;
        setCategories(cats);
        if (isNew) {
          const start = { ...EMPTY, category: cats[0]?.slug ?? "" };
          setSaved(start);
          setDraft(start);
          return;
        }
        const p = projects.find((x) => x.id === id);
        if (!p) {
          setErrors({ title: "Projet introuvable.", items: [] });
          return;
        }
        const { id: _id, order: _order, ...input } = p;
        setSaved(input);
        setDraft(input);
      } catch (e) {
        if (alive) setErrors({ title: e instanceof ApiError ? e.message : "Chargement impossible.", items: [] });
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  const dirty = useMemo(() => saved !== null && JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);
  useUnsavedGuard(dirty && !saving);

  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => setDraft((d) => ({ ...d, [key]: value }));
  // The address follows the French name until it is edited by hand.
  const setTitle = (title: ProjectInput["title"]) => setDraft((d) => ({ ...d, title, ...(slugTouched ? {} : { slug: slugify(title.fr) }) }));
  const setImage = (i: number, img: RawImage | null) => {
    if (!img) return;
    set("images", draft.images.map((x, j) => (j === i ? img : x)));
  };

  const save = async () => {
    const missing: string[] = [];
    if (!draft.cover) missing.push("Ajoutez l’image de la carte.");
    if (!draft.images.length) missing.push("Ajoutez au moins une image au projet.");
    if (missing.length) {
      setErrors({ title: "Il manque des images.", items: missing });
      return;
    }
    const added = (["ar", "en"] as Locale[])
      .map((l) => ({ l, n: projectGaps(draft, l) - (saved && !isNew ? projectGaps(saved, l) : 0) }))
      .filter((x) => x.n > 0);
    if (
      added.length &&
      !window.confirm(
        `${added.map((x) => `${x.n} texte(s) sans traduction ${LANG_IN[x.l]}`).join(", ")}.\nLe texte français sera affiché à leur place tant qu’ils ne sont pas traduits.\n\nEnregistrer quand même ?`,
      )
    )
      return;
    setSaving(true);
    setErrors(null);
    try {
      const res = isNew ? await adminApi.createProject(draft) : await adminApi.updateProject(id ?? "", draft);
      const { id: newId, order: _order, ...input } = res;
      setSaved(input);
      setDraft(input);
      toast("ok", isNew ? "Projet créé. Il est en ligne." : "Projet enregistré. Le site est à jour.");
      if (isNew) navigate(`/admin/projets/${newId}`, { replace: true });
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors({ title: e.message, items: e.issues.map((i) => `${LABELS[i.path.split(".")[0] ?? ""] ?? i.path}${langSuffix(i.path)} : ${i.message}`) });
      } else setErrors({ title: "Enregistrement impossible.", items: [] });
    } finally {
      setSaving(false);
    }
  };

  if (!saved) return errors ? <ErrorList title={errors.title} items={errors.items} /> : <Spinner />;

  return (
    <div className="a-page">
      <header className="a-page__head">
        <div>
          <p className="a-eyebrow">
            <Link to="/admin/projets">Projets</Link> /
          </p>
          <h1>{isNew ? "Nouveau projet" : pickText(draft.title, lang) || "Projet"}</h1>
        </div>
        {!isNew && saved.slug && (
          <a className="a-btn a-btn--ghost" href={localizePath(`/projets/${saved.slug}`, lang)} target="_blank" rel="noopener">
            Voir sur le site ↗
          </a>
        )}
      </header>
      <EditLangTabs gaps={Object.fromEntries(LOCALES.map((l) => [l, projectGaps(draft, l)]))} />

      {errors && <ErrorList title={errors.title} items={errors.items} />}

      <section className={`a-card${dirty ? " is-dirty" : ""}`}>
        <div className="a-card__head">
          <h2>Informations</h2>
          <span className="a-row">
            <GapBadge count={projectGaps(draft, lang)} lang={lang} />
            {dirty && <span className="a-pill">Modifications non enregistrées</span>}
          </span>
        </div>
        <div className="a-card__body a-cols">
          <LocalizedTextField label={LABELS.title ?? ""} value={draft.title} onChange={setTitle} />
          <TextField
            label={LABELS.slug ?? ""}
            value={draft.slug}
            onChange={(v) => {
              setSlugTouched(true);
              set("slug", slugify(v));
            }}
            help={`Adresse : /projets/${draft.slug || "…"}`}
          />
          <LocalizedTextField label={LABELS.place ?? ""} value={draft.place} onChange={(v) => set("place", v)} help="Affiché sur la carte du projet." />
          <LocalizedTextField
            label={LABELS.typeLabel ?? ""}
            value={draft.typeLabel}
            onChange={(v) => set("typeLabel", v)}
            help="Ce qu’est le projet, affiché sur la carte. Ex. : Résidentiel, Restauration."
          />
          <div className="a-field">
            <label className="a-label" htmlFor="project-category">
              {LABELS.category}
            </label>
            <select id="project-category" value={draft.category} onChange={(e) => set("category", e.target.value)}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {pickText(c.name, lang)}
                </option>
              ))}
            </select>
            <p className="a-help">
              Regroupement sur la page Projets. Gérez les catégories dans <Link to="/admin/projets">la liste des projets</Link>.
            </p>
          </div>
          <LocalizedTextField label={LABELS.attribution ?? ""} value={draft.attribution} onChange={(v) => set("attribution", v)} optional help="Ex. : Projet développé au sein d’une entreprise." />
          <div className="a-cols__full">
            <LocalizedTextField label={LABELS.description ?? ""} value={draft.description} onChange={(v) => set("description", v)} multiline />
          </div>
        </div>
      </section>

      <section className="a-card">
        <div className="a-card__head">
          <h2>Image de la carte</h2>
        </div>
        <p className="a-help">Toutes les cartes de la page Projets ont le même format (16:10).</p>
        <ImageField label={LABELS.cover ?? ""} ratio="16 / 10" value={draft.cover ?? null} onChange={(img) => img && set("cover", img)} />
      </section>

      <section className="a-card">
        <div className="a-card__head">
          <h2>Images du projet</h2>
          <span className="a-help">{draft.images.length} image{draft.images.length > 1 ? "s" : ""}</span>
        </div>
        <p className="a-help">La première image ouvre la page du projet et illustre le lien « Projet suivant ». Les suivantes forment la galerie, avec leur description en légende.</p>
        <div className="a-items">
          {draft.images.map((img, i) => (
            <div className="a-item" key={`${i}-${img.src}`}>
              <ImageField
                label={i === 0 ? "Image d’ouverture" : `Galerie · image ${i}`}
                ratio={ratioFor(i)}
                value={img}
                onChange={(v) => setImage(i, v)}
                onRemove={() => window.confirm("Retirer cette image du projet ?") && set("images", draft.images.filter((_, j) => j !== i))}
                extraActions={<MoveButtons index={i} length={draft.images.length} onMove={(a, b) => set("images", move(draft.images, a, b))} label="l’image" />}
              />
            </div>
          ))}
        </div>
        <AddImage onAdd={(img) => set("images", [...draft.images, img])} ratio={ratioFor(draft.images.length)} />
      </section>

      <div className="a-sticky-actions">
        <Link className="a-btn a-btn--ghost" to="/admin/projets" onClick={confirmLeave}>
          Retour
        </Link>
        <div className="a-row">
          <button type="button" className="a-btn a-btn--ghost" disabled={!dirty || saving} onClick={() => (setDraft(saved), setErrors(null))}>
            Annuler
          </button>
          <button type="button" className="a-btn a-btn--primary" disabled={(!dirty && !isNew) || saving} onClick={save}>
            {saving ? "Enregistrement…" : isNew ? "Créer le projet" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

const langSuffix = (path: string) => ({ fr: " (français)", ar: " (arabe)", en: " (anglais)" })[path.split(".").pop() ?? ""] ?? "";

function AddImage({ onAdd, ratio }: { onAdd: (img: RawImage) => void; ratio: string }) {
  const [key, setKey] = useState(0);
  return <ImageField key={key} label="Ajouter une image" ratio={ratio} value={null} onChange={(img) => img && (onAdd(img), setKey((k) => k + 1))} />;
}
