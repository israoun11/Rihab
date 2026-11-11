import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import type { Project } from "@rihab/shared";
import { Frame } from "./Frame";
import { Arrow } from "./Arrow";

interface Labels {
  link: string;
  carouselLabel: string;
}

interface Props {
  projects: Project[];
  labels: Labels;
  /** Seconds each project stays on screen. */
  interval: number;
}

/**
 * Homepage projects slider: one framed project at a time, centered on a light
 * backdrop, with its name, place, type and link laid over the bottom of the image.
 * Projects change automatically with a cross-fade; there are no arrows, numbers
 * or indicators. Autoplay pauses on hover, keyboard focus, when the slider is
 * off-screen or the tab is hidden, and is disabled with reduced motion.
 * Touch swipe and the keyboard arrows still change project.
 */
export function ProjectSlider({ projects, labels, interval }: Props) {
  const count = projects.length;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [hiddenTab, setHiddenTab] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [announce, setAnnounce] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const paused = hovered || focused || offscreen || hiddenTab;
  const autoplay = count > 1 && !reduceMotion && !paused;

  /* ---------- Environment: reduced motion, visibility, viewport ---------- */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduceMotion(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    const onVis = () => setHiddenTab(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    let io: IntersectionObserver | null = null;
    if (rootRef.current && "IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => setOffscreen(!(entries[0]?.isIntersecting ?? true)), { threshold: 0.25 });
      io.observe(rootRef.current);
    }
    return () => {
      mq.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, []);

  // Keep the index valid if projects are added or removed while the page is open.
  useEffect(() => {
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

  /* ---------- Navigation ---------- */
  const go = useCallback(
    (step: number, manual: boolean) => {
      if (count < 2) return;
      setAnnounce(manual);
      setIndex((i) => (((i + step) % count) + count) % count);
    },
    [count],
  );

  // Automatic advance: one timer per displayed project, cleared on every change or pause.
  useEffect(() => {
    if (!autoplay) return;
    const t = window.setTimeout(() => go(1, false), interval * 1000);
    return () => window.clearTimeout(t);
  }, [autoplay, index, interval, go]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1, true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1, true);
    }
  };

  // Swipe on touch screens.
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1, true);
  };

  if (count === 0) return null;
  const current = projects[Math.min(index, count - 1)]!;

  return (
    <div
      ref={rootRef}
      className={`pslider${reduceMotion ? " is-static" : ""}`}
      role="region"
      aria-roledescription="carrousel"
      aria-label={labels.carouselLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
    >
      <div className="pslider__frame">
        {projects.map((p, i) => (
          <Link
            key={p.id}
            to={`/projets/${p.slug}`}
            className={`pslider__slide${i === index ? " is-active" : ""}`}
            aria-hidden={i !== index}
            tabIndex={-1}
            inert={i !== index}
          >
            <Frame image={p.images[0] ?? p.cover} ratio="frame--port" eager={i === 0} sizes="(max-width: 1440px) 92vw, 1320px" />
          </Link>
        ))}
        <div className="pslider__shade" aria-hidden="true"></div>
        <div className="pslider__text" key={current.id} aria-live={announce ? "polite" : "off"}>
          <h3 className="pslider__title">
            <Link to={`/projets/${current.slug}`} tabIndex={-1}>
              {current.title}
            </Link>
          </h3>
          <p className="pslider__meta">
            {current.place} - {current.typeLabel}
          </p>
          <Link className="link pslider__link" to={`/projets/${current.slug}`} aria-label={`${labels.link} ${current.title}`}>
            <span>{labels.link}</span> <Arrow />
          </Link>
        </div>
      </div>
    </div>
  );
}
