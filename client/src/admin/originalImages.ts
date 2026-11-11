import { DEFAULT_CONTENT, DEFAULT_PROJECTS, type ImageValue } from "@rihab/shared";

/** Every image of the original site, so a replaced image can always be put back. */
export function originalImages(): ImageValue[] {
  const found = new Map<string, ImageValue>();
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    const o = v as Record<string, unknown>;
    if (typeof o.src === "string" && typeof o.width === "number" && typeof o.height === "number") {
      if (!found.has(o.src)) found.set(o.src, o as unknown as ImageValue);
      return;
    }
    Object.values(o).forEach(walk);
  };
  walk(DEFAULT_CONTENT);
  walk(DEFAULT_PROJECTS);
  return [...found.values()];
}
