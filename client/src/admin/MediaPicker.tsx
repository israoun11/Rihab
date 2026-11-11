import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { ImageValue } from "@rihab/shared";
import { ApiError } from "../api/http";
import { adminApi, formatSize, type MediaItem } from "./api";
import { originalImages } from "./originalImages";
import { Modal, Spinner, useToast } from "./ui";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_MB = 10;

interface Props {
  ratio: string;
  current?: ImageValue | null;
  onPick: (img: ImageValue) => void;
  onClose: () => void;
}

type Choice = { kind: "media"; item: MediaItem } | { kind: "original"; img: ImageValue };

/** Choose an image from the library, upload a new one, or restore an original image. */
export function MediaPicker({ ratio, current, onPick, onClose }: Props) {
  const toast = useToast();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const originals = useMemo(originalImages, []);

  useEffect(() => {
    adminApi
      .media()
      .then(setItems)
      .catch((e: unknown) => {
        toast("error", e instanceof ApiError ? e.message : "Médiathèque indisponible.");
        setItems([]);
      });
  }, [toast]);

  const upload = async (file: File) => {
    if (!ACCEPT.includes(file.type)) {
      toast("error", "Format non pris en charge. Utilisez une image JPG, PNG, WebP, AVIF ou GIF.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast("error", `Image trop lourde (${formatSize(file.size)}). Maximum : ${MAX_MB} Mo.`);
      return;
    }
    const preview = URL.createObjectURL(file);
    setUploading(preview);
    try {
      const item = await adminApi.upload(file);
      setItems((list) => [item, ...(list ?? [])]);
      setChoice({ kind: "media", item });
      toast("ok", "Image ajoutée à la médiathèque.");
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Envoi impossible.");
    } finally {
      URL.revokeObjectURL(preview);
      setUploading(null);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) void upload(file);
  };

  const confirm = () => {
    if (!choice) return;
    const keepAlt = current?.alt ?? "";
    if (choice.kind === "media") {
      onPick({ src: choice.item.url, width: choice.item.width, height: choice.item.height, alt: keepAlt });
    } else {
      onPick({ ...choice.img, alt: choice.img.alt || keepAlt });
    }
    onClose();
  };

  const selectedSrc = choice ? (choice.kind === "media" ? choice.item.url : choice.img.src) : null;

  return (
    <Modal title="Choisir une image" onClose={onClose} wide>
      <div
        className={`a-drop${drag ? " is-drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <div className="a-drop__uploading">
            <img src={uploading} alt="" />
            <Spinner label="Envoi de l’image…" />
          </div>
        ) : (
          <>
            <p>
              <strong>Glissez une image ici</strong> ou
            </p>
            <button type="button" className="a-btn" onClick={() => inputRef.current?.click()}>
              Importer depuis l’ordinateur
            </button>
            <p className="a-help">JPG, PNG, WebP, AVIF ou GIF, {MAX_MB} Mo maximum. L’image sera recadrée au format du site ({ratio.replace(/\s/g, "")}) sans être déformée.</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </div>

      <h3 className="a-subtitle">Médiathèque</h3>
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="a-help">Aucune image importée pour l’instant.</p>
      ) : (
        <div className="a-grid-media">
          {items.map((m) => (
            <button
              type="button"
              key={m.id}
              className={`a-thumb${selectedSrc === m.url ? " is-selected" : ""}`}
              onClick={() => setChoice({ kind: "media", item: m })}
              aria-pressed={selectedSrc === m.url}
            >
              <span className="a-thumb__img" style={{ aspectRatio: ratio }}>
                <img src={m.url} alt="" loading="lazy" />
              </span>
              <span className="a-thumb__name">{m.filename}</span>
              <span className="a-thumb__meta">
                {m.width} × {m.height}
              </span>
            </button>
          ))}
        </div>
      )}

      <h3 className="a-subtitle">Images d’origine du site</h3>
      <div className="a-grid-media">
        {originals.map((o) => (
          <button
            type="button"
            key={o.src}
            className={`a-thumb${selectedSrc === o.src ? " is-selected" : ""}`}
            onClick={() => setChoice({ kind: "original", img: o })}
            aria-pressed={selectedSrc === o.src}
          >
            <span className="a-thumb__img" style={{ aspectRatio: ratio }}>
              <img src={o.src} alt="" loading="lazy" />
            </span>
            <span className="a-thumb__name">{o.src.split("/").pop()}</span>
            <span className="a-thumb__meta">{o.demo ? "Démonstration" : `${o.width} × ${o.height}`}</span>
          </button>
        ))}
      </div>

      <div className="a-modal__foot">
        <button type="button" className="a-btn a-btn--ghost" onClick={onClose}>
          Annuler
        </button>
        <button type="button" className="a-btn a-btn--primary" disabled={!choice} onClick={confirm}>
          Utiliser cette image
        </button>
      </div>
    </Modal>
  );
}
