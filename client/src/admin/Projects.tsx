import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { localizePath, pickText, projectGaps, type CategoryRecord as Category, type ProjectRecord as Project } from "@rihab/shared";
import { ApiError } from "../api/http";
import { adminApi, slugify } from "./api";
import { move, MoveButtons } from "./fields";
import { ErrorList, Spinner, useToast } from "./ui";
import { EditLangTabs, GapBadge, LANG_IN, useEditLang } from "./editLang";

export function ProjectsAdmin() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const { lang } = useEditLang();

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([adminApi.projects(), adminApi.categories()]);
      setProjects(p);
      setCategories(c);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Chargement impossible.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const fail = (e: unknown) => toast("error", e instanceof ApiError ? e.message : "Opération impossible.");

  const reorder = async (from: number, to: number) => {
    if (!projects) return;
    const next = move(projects, from, to);
    setProjects(next);
    try {
      setProjects(await adminApi.orderProjects(next.map((p) => p.id)));
    } catch (e) {
      fail(e);
      void load();
    }
  };

  const remove = async (p: Project) => {
    if (!window.confirm(`Supprimer définitivement le projet « ${p.title.fr} » (dans les trois langues) ? Ses images restent dans la médiathèque.`)) return;
    try {
      await adminApi.deleteProject(p.id);
      setProjects((list) => list?.filter((x) => x.id !== p.id) ?? null);
      toast("ok", "Projet supprimé.");
    } catch (e) {
      fail(e);
    }
  };

  if (error) return <ErrorList title={error} items={[]} />;
  if (!projects) return <Spinner />;

  const catName = (slug: string) => {
    const c = categories.find((x) => x.slug === slug);
    return c ? pickText(c.name, lang) : slug;
  };
  const gaps = {
    ar: projects.reduce((n, p) => n + projectGaps(p, "ar"), 0) + categories.filter((c) => !c.name.ar).length,
    en: projects.reduce((n, p) => n + projectGaps(p, "en"), 0) + categories.filter((c) => !c.name.en).length,
  };

  return (
    <div className="a-page">
      <header className="a-page__head">
        <div>
          <p className="a-eyebrow">Contenu</p>
          <h1>Projets</h1>
          <p className="a-help">L’ordre ci-dessous est celui de la page Projets (au sein de chaque catégorie) et du lien « Projet suivant ».</p>
        </div>
        <div className="a-row">
          <a className="a-btn a-btn--ghost" href={localizePath("/projets", lang)} target="_blank" rel="noopener">
            Voir sur le site ↗
          </a>
          <Link className="a-btn a-btn--primary" to="/admin/projets/nouveau">
            + Nouveau projet
          </Link>
        </div>
      </header>

      <EditLangTabs gaps={gaps} />

      <section className="a-card">
        <div className="a-card__head">
          <h2>{projects.length} projet{projects.length > 1 ? "s" : ""}</h2>
        </div>
        {projects.length === 0 && <p className="a-help">Aucun projet : la page Projets et le diaporama de l’accueil n’affichent rien tant qu’un projet n’est pas créé.</p>}
        <ul className="a-list">
          {projects.map((p, i) => (
            <li className="a-list__row" key={p.id}>
              <span className="a-list__thumb">
                {(p.cover ?? p.images[0]) && <img src={(p.cover ?? p.images[0])!.src} alt="" />}
              </span>
              <span className="a-list__main">
                <strong dir="auto">{pickText(p.title, lang)}</strong>
                <span className="a-help" dir="auto">
                  {pickText(p.place, lang)} · {pickText(p.typeLabel, lang)} · catégorie {catName(p.category)} · {p.images.length} image{p.images.length > 1 ? "s" : ""}
                </span>
                <GapBadge count={projectGaps(p, lang)} lang={lang} />
              </span>
              <span className="a-row a-list__actions">
                <MoveButtons index={i} length={projects.length} onMove={reorder} label="le projet" />
                <Link className="a-btn a-btn--sm" to={`/admin/projets/${p.id}`}>
                  Modifier
                </Link>
                <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--danger" onClick={() => remove(p)}>
                  Supprimer
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <CategoriesCard categories={categories} projects={projects} onChange={setCategories} lang={lang} />
    </div>
  );
}

function CategoriesCard({
  categories,
  projects,
  onChange,
  lang,
}: {
  categories: Category[];
  projects: Project[];
  onChange: (c: Category[]) => void;
  lang: "fr" | "ar" | "en";
}) {
  const toast = useToast();
  const [names, setNames] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const fail = (e: unknown) => toast("error", e instanceof ApiError ? e.message : "Opération impossible.");

  const own = (c: Category) => (lang === "fr" ? c.name.fr : c.name[lang]) ?? "";
  useEffect(() => setNames(Object.fromEntries(categories.map((c) => [c.id, own(c)]))), [categories, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const rename = async (c: Category) => {
    const name = (names[c.id] ?? "").trim();
    if ((lang === "fr" && !name) || name === own(c)) return;
    try {
      const updated = await adminApi.updateCategory(c.id, { ...c.name, [lang]: name });
      onChange(categories.map((x) => (x.id === c.id ? updated : x)));
      toast("ok", "Catégorie renommée.");
    } catch (e) {
      fail(e);
    }
  };
  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const c = await adminApi.createCategory(slugify(name) || "categorie", { fr: name });
      onChange([...categories, c]);
      setNewName("");
      toast("ok", "Catégorie ajoutée.");
    } catch (e) {
      fail(e);
    }
  };
  const remove = async (c: Category) => {
    if (!window.confirm(`Supprimer la catégorie « ${c.name.fr} » ?`)) return;
    try {
      await adminApi.deleteCategory(c.id);
      onChange(categories.filter((x) => x.id !== c.id));
      toast("ok", "Catégorie supprimée.");
    } catch (e) {
      fail(e);
    }
  };
  const reorder = async (from: number, to: number) => {
    const next = move(categories, from, to);
    onChange(next);
    try {
      onChange(await adminApi.orderCategories(next.map((c) => c.id)));
    } catch (e) {
      fail(e);
    }
  };

  return (
    <section className="a-card">
      <div className="a-card__head">
        <h2>Catégories</h2>
      </div>
      <p className="a-help">
        Les projets sont regroupés par catégorie sur la page Projets, dans cet ordre. Une catégorie sans projet n’est pas affichée. Les noms ci-dessous sont ceux{" "}
        {LANG_IN[lang]}.
      </p>
      <ul className="a-list">
        {categories.map((c, i) => {
          const count = projects.filter((p) => p.category === c.slug).length;
          return (
            <li className="a-list__row" key={c.id}>
              <span className="a-list__main a-row">
                <input
                  type="text"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  placeholder={lang !== "fr" ? c.name.fr : undefined}
                  aria-label={`Nom de la catégorie ${c.name.fr} ${LANG_IN[lang]}`}
                  value={names[c.id] ?? ""}
                  onChange={(e) => setNames((n) => ({ ...n, [c.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && void rename(c)}
                />
                <span className="a-help">
                  {count} projet{count > 1 ? "s" : ""}
                </span>
                {lang !== "fr" && !c.name[lang] && <span className="a-pill a-pill--warn">À traduire</span>}
              </span>
              <span className="a-row a-list__actions">
                <button
                  type="button"
                  className="a-btn a-btn--sm"
                  disabled={(names[c.id] ?? "").trim() === own(c) || (lang === "fr" && !(names[c.id] ?? "").trim())}
                  onClick={() => rename(c)}
                >
                  Enregistrer
                </button>
                <MoveButtons index={i} length={categories.length} onMove={reorder} label="la catégorie" />
                <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--danger" onClick={() => remove(c)}>
                  Supprimer
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="a-row a-add">
        <input type="text" placeholder="Nouvelle catégorie (nom en français)" aria-label="Nom de la nouvelle catégorie, en français" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void add()} />
        <button type="button" className="a-btn a-btn--sm" onClick={add} disabled={!newName.trim()}>
          + Ajouter
        </button>
      </div>
    </section>
  );
}
