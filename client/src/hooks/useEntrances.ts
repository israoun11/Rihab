import { useEffect, type DependencyList } from "react";

/**
 * Section entrances, ported from the original main.js: elements marked [data-in]
 * that start below the fold fade up when they enter the viewport.
 */
export function useEntrances(deps: DependencyList): void {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    const vh = window.innerHeight;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-in]")).filter((el) => !el.dataset.inSeen);
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            en.target.classList.remove("pre");
            io.unobserve(en.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    for (const el of els) {
      el.dataset.inSeen = "1";
      if (el.getBoundingClientRect().top > vh * 0.92) {
        el.classList.add("pre");
        io.observe(el);
      }
    }
    // Safety net: never leave content hidden.
    const t = window.setTimeout(() => {
      document.querySelectorAll(".pre").forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("in");
          el.classList.remove("pre");
        }
      });
    }, 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
      for (const el of els) {
        if (el.classList.contains("pre")) {
          el.classList.remove("pre");
          delete el.dataset.inSeen;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
