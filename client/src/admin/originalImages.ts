import { DEFAULT_PROJECTS, DEFAULT_RAW_CONTENT, type RawImage } from "@rihab/shared";

/** Every image of the original site (with its descriptions in every language), so a replaced image can always be put back. */
export function originalImages(): RawImage[] {
  const found = new Map<string, RawImage>();
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    const o = v as Record<string, unknown>;
    if (typeof o.src === "string" && typeof o.width === "number" && typeof o.height === "number") {
      if (!found.has(o.src)) found.set(o.src, o as unknown as RawImage);
      return;
    }
    Object.values(o).forEach(walk);
  };
  walk(DEFAULT_RAW_CONTENT);
  walk(DEFAULT_PROJECTS);
  return [...found.values()];
}
