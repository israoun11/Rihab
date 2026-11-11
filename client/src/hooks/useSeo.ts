import { useEffect } from "react";
import { plain } from "@rihab/shared";

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

export function useSeo(title: string, description: string): void {
  useEffect(() => {
    const t = plain(title);
    const d = plain(description);
    document.title = t;
    setMeta('meta[name="description"]', "name", "description", d);
    setMeta('meta[property="og:title"]', "property", "og:title", t);
    setMeta('meta[property="og:description"]', "property", "og:description", d);
  }, [title, description]);
}
