import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Category, Project } from "@rihab/shared";
import { ApiError } from "../api/http";
import { adminApi, slugify } from "./api";
import { move, MoveButtons } from "./fields";
import { ErrorList, Spinner, useToast } from "./ui";

export function ProjectsAdmin() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

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
    if (!window.confirm(`Supprimer définitivement le projet « ${p.title} » ? Ses images restent dans la médiathèque.`)) return;
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

  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="a-page">
      <header className="a-page__head">
        <div>
          <p className="a-eyebrow">Contenu</p>
          <h1>Projets</h1>
          <p className="a-help">L’ordre ci-dessous est celui de la page Projets (au sein de chaque catégorie) et du lien « Projet suivant ».</p>
        </div>
        <div className="a-row">
          <a className="a-btn a-btn--ghost" href="/projets" target="_blank" rel="noopener">
            Voir sur le site ↗
          </a>
          <Link className="a-btn a-btn--primary" to="/admin/projets/nouveau">
            + Nouveau projet
          </Link>
        </div>
      </header>

      <section className="a-card">
        <div className="a-card__head">
          <h2>{projects.length} projet{projects.length > 1 ? "s" : ""}</h2>
        </div>
        <ul className="a-list">
          {projects.map((p, i) => (
            <li className="a-list__row" key={p.id}>
              <span className="a-list__thumb">
                <img src={p.cover.src} alt="" />
              </span>
              <span className="a-list__main">
                <strong>{p.title}</strong>
                <span className="a-help">
                  {p.place} · {p.typeLabel} · catégorie {catName(p.category)} · {p.images.length} image{p.images.length > 1 ? "s" : ""}
                </span>
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

      <CategoriesCard categories={categories} projects={projects} onChange={setCategories} />
    </div>
  );
}

function CategoriesCard({ categories, projects, onChange }: { categories: Category[]; projects: Project[]; onChange: (c: Category[]) => void }) {
  const toast = useToast();
  const [names, setNames] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const fail = (e: unknown) => toast("error", e instanceof ApiError ? e.message : "Opération impossible.");

  useEffect(() => setNames(Object.fromEntries(categories.map((c) => [c.id, c.name]))), [categories]);

  const rename = async (c: Category) => {
    const name = (names[c.id] ?? "").trim();
    if (!name || name === c.name) return;
    try {
      const updated = await adminApi.updateCategory(c.id, name);
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
      const c = await adminApi.createCategory(slugify(name) || "categorie", name);
      onChange([...categories, c]);
      setNewName("");
      toast("ok", "Catégorie ajoutée.");
    } catch (e) {
      fail(e);
    }
  };
  const remove = async (c: Category) => {
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ?`)) return;
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
      <p className="a-help">Les projets sont regroupés par catégorie sur la page Projets, dans cet ordre. Une catégorie sans projet n’est pas affichée.</p>
      <ul className="a-list">
        {categories.map((c, i) => {
          const count = projects.filter((p) => p.category === c.slug).length;
          return (
            <li className="a-list__row" key={c.id}>
              <span className="a-list__main a-row">
                <input
                  type="text"
                  aria-label={`Nom de la catégorie ${c.name}`}
                  value={names[c.id] ?? ""}
                  onChange={(e) => setNames((n) => ({ ...n, [c.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && void rename(c)}
                />
                <span className="a-help">
                  {count} projet{count > 1 ? "s" : ""}
                </span>
              </span>
              <span className="a-row a-list__actions">
                <button type="button" className="a-btn a-btn--sm" disabled={(names[c.id] ?? "").trim() === c.name || !(names[c.id] ?? "").trim()} onClick={() => rename(c)}>
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
        <input type="text" placeholder="Nouvelle catégorie" aria-label="Nom de la nouvelle catégorie" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void add()} />
        <button type="button" className="a-btn a-btn--sm" onClick={add} disabled={!newName.trim()}>
          + Ajouter
        </button>
      </div>
    </section>
  );
}
