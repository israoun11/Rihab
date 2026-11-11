import { useEffect, useRef, useState } from "react";
import { ApiError } from "../api/http";
import { adminApi, formatSize, type MediaItem } from "./api";
import { ErrorList, Spinner, useToast } from "./ui";

export function MediaLibrary() {
  const toast = useToast();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi
      .media()
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Chargement impossible."));
  }, []);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        const item = await adminApi.upload(file);
        setItems((l) => [item, ...(l ?? [])]);
        toast("ok", `« ${file.name} » ajoutée.`);
      } catch (e) {
        toast("error", `${file.name} : ${e instanceof ApiError ? e.message : "envoi impossible."}`);
      }
    }
    setBusy(false);
  };

  const remove = async (m: MediaItem) => {
    if (!window.confirm(`Supprimer « ${m.filename} » de la médiathèque ?`)) return;
    try {
      await adminApi.deleteMedia(m.id);
      setItems((l) => l?.filter((x) => x.id !== m.id) ?? null);
      toast("ok", "Image supprimée.");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const usages = (e.details as { usages?: string[] } | undefined)?.usages ?? [];
        toast("error", `${e.message} ${usages.join(" ; ")}`);
      } else toast("error", e instanceof ApiError ? e.message : "Suppression impossible.");
    }
  };

  if (error) return <ErrorList title={error} items={[]} />;

  return (
    <div className="a-page">
      <header className="a-page__head">
        <div>
          <p className="a-eyebrow">Contenu</p>
          <h1>Médiathèque</h1>
          <p className="a-help">Images importées, enregistrées dans la base de données. Une image utilisée sur le site ne peut pas être supprimée.</p>
        </div>
        <button type="button" className="a-btn a-btn--primary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Envoi…" : "+ Importer des images"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          hidden
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </header>
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="a-help">Aucune image importée pour l’instant. Les images d’origine du site restent disponibles dans le sélecteur d’image.</p>
      ) : (
        <div className="a-grid-media a-grid-media--lib">
          {items.map((m) => (
            <figure className="a-thumb" key={m.id}>
              <span className="a-thumb__img" style={{ aspectRatio: "4 / 3" }}>
                <img src={m.url} alt="" loading="lazy" />
              </span>
              <figcaption>
                <span className="a-thumb__name">{m.filename}</span>
                <span className="a-thumb__meta">
                  {m.width} × {m.height} · {formatSize(m.size)}
                </span>
                <span className="a-row">
                  <a className="a-btn a-btn--ghost a-btn--sm" href={m.url} target="_blank" rel="noopener">
                    Ouvrir
                  </a>
                  <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--danger" onClick={() => remove(m)}>
                    Supprimer
                  </button>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
