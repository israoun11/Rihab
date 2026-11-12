/**
 * Dashboard → public site notification. After every change saved in the
 * dashboard, open tabs of the public site (same browser) reload their content
 * at once; other visitors get it on their next page load, when they come back
 * to the tab, or within 30 seconds.
 */
export const CONTENT_CHANNEL = "rb-content";
export const CONTENT_STORAGE_KEY = "rb-content-updated";

export function notifyContentChanged(): void {
  try {
    if ("BroadcastChannel" in window) {
      const c = new BroadcastChannel(CONTENT_CHANNEL);
      c.postMessage(Date.now());
      c.close();
    }
    window.localStorage.setItem(CONTENT_STORAGE_KEY, String(Date.now()));
  } catch {
    /* storage unavailable: the site still refreshes on focus and every 30 s */
  }
}
