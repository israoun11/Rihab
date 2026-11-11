import { useEffect, type RefObject } from "react";

/**
 * Hero: hidden photograph revealed by the pointer. Same behaviour and timings
 * as the original main.js, with full cleanup for React.
 */
export function useHeroReveal(ref: RefObject<HTMLElement | null>, imageKey: string): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const maskOK =
      typeof CSS !== "undefined" &&
      (CSS.supports("mask-image", "radial-gradient(#000, transparent)") || CSS.supports("-webkit-mask-image", "radial-gradient(#000, transparent)"));
    if (reduce || !maskOK) return; // static treatment from CSS
    if (!finePointer) {
      el.classList.add("hero--touch");
      return () => el.classList.remove("hero--touch");
    }
    return setupReveal(el);
  }, [ref, imageKey]);
}

function setupReveal(el: HTMLElement): () => void {
  el.classList.add("hero--interactive");
  const layer = el.querySelector<HTMLElement>(".hero__reveal");
  if (!layer) return () => el.classList.remove("hero--interactive");
  void layer.offsetWidth;
  const cur = { x: 0, y: 0, r: 0, a: 0 };
  const tgt = { x: 0, y: 0, r: 0, a: 0 };
  let rect = layer.getBoundingClientRect();
  const baseR = () => Math.max(260, Math.min(420, el.clientWidth * 0.24));
  let running = false;
  let visible = true;
  let raf = 0;
  let introDone = false;
  let introStart = 0;
  let startTimer = 0;

  cur.x = tgt.x = rect.width * 0.62;
  cur.y = tgt.y = rect.height * 0.42;

  const measure = () => {
    rect = layer.getBoundingClientRect();
  };
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("scroll", measure, { passive: true });

  const apply = () => {
    layer.style.setProperty("--x", cur.x.toFixed(1) + "px");
    layer.style.setProperty("--y", cur.y.toFixed(1) + "px");
    layer.style.setProperty("--r", cur.r.toFixed(1) + "px");
    layer.style.setProperty("--a", cur.a.toFixed(3));
  };

  const tick = (t: number) => {
    if (!introDone) {
      // Initial hint: a slow drift across the image, then back to darkness.
      if (!introStart) introStart = t;
      const p = Math.min(1, (t - introStart) / 2600);
      const e = 0.5 - Math.cos(p * Math.PI) / 2;
      tgt.x = rect.width * (0.38 + 0.34 * e);
      tgt.y = rect.height * (0.5 - 0.12 * Math.sin(p * Math.PI));
      tgt.r = baseR() * 0.95;
      tgt.a = p < 0.75 ? 0.85 : 0.85 * (1 - (p - 0.75) / 0.25);
      if (p >= 1) {
        introDone = true;
        tgt.a = 0;
      }
    }
    const k = 0.12;
    cur.x += (tgt.x - cur.x) * k;
    cur.y += (tgt.y - cur.y) * k;
    cur.r += (tgt.r - cur.r) * 0.08;
    cur.a += (tgt.a - cur.a) * 0.07;
    apply();
    const settled =
      introDone &&
      Math.abs(tgt.x - cur.x) < 0.3 &&
      Math.abs(tgt.y - cur.y) < 0.3 &&
      Math.abs(tgt.a - cur.a) < 0.002 &&
      Math.abs(tgt.r - cur.r) < 0.3;
    if (settled || !visible) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!running && visible) {
      running = true;
      raf = requestAnimationFrame(tick);
    }
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    introDone = true;
    el.classList.add("has-moved");
    tgt.x = e.clientX - rect.left;
    tgt.y = e.clientY - rect.top;
    tgt.r = baseR();
    tgt.a = 1;
    start();
  };
  const onLeave = () => {
    tgt.a = 0;
    tgt.r = baseR() * 0.7;
    start();
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);

  // Pause the effect while the hero is off screen.
  let io: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) {
        measure();
        start();
      } else {
        cancelAnimationFrame(raf);
        running = false;
      }
    });
    io.observe(el);
  }

  // Start the hint once the image has loaded.
  const img = layer.querySelector("img");
  const go = () => {
    startTimer = window.setTimeout(start, 450);
  };
  if (img && !img.complete) img.addEventListener("load", go, { once: true });
  else go();

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(startTimer);
    window.removeEventListener("resize", measure);
    window.removeEventListener("scroll", measure);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    img?.removeEventListener("load", go);
    io?.disconnect();
    el.classList.remove("hero--interactive", "has-moved");
  };
}
