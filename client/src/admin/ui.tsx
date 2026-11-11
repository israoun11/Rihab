import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/* ---------- Toasts ---------- */
interface Toast {
  id: number;
  kind: "ok" | "error";
  text: string;
}
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="a-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`a-toast a-toast--${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------- Modal dialog ---------- */
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("a-modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("a-modal-open");
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div className="a-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`a-modal__box${wide ? " a-modal__box--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="a-modal__head">
          <h2>{title}</h2>
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="a-modal__body">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Confirm ---------- */
export function useConfirm() {
  return (message: string) => window.confirm(message);
}

/* ---------- Leave guard for unsaved changes ---------- */
const unsaved = new Set<symbol>();
export const LEAVE_MESSAGE = "Des modifications ne sont pas enregistrées. Quitter sans enregistrer ?";

/** For in-app links: asks before leaving a page with unsaved changes. */
export function confirmLeave(e: { preventDefault: () => void }) {
  if (unsaved.size && !window.confirm(LEAVE_MESSAGE)) e.preventDefault();
}

export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const token = Symbol("unsaved");
    unsaved.add(token);
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      unsaved.delete(token);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty]);
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <p className="a-loading" role="status">
      <span className="a-spinner" aria-hidden="true" />
      {label}
    </p>
  );
}

export function ErrorList({ title, items }: { title: string; items: string[] }) {
  if (!items.length && !title) return null;
  return (
    <div className="a-error" role="alert">
      <strong>{title}</strong>
      {items.length > 0 && (
        <ul>
          {items.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
