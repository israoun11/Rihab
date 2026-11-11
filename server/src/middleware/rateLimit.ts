import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/httpError.js";

/** Small fixed-window limiter (per IP, in memory). Enough for a single-instance admin login. */
export function rateLimit(opts: { max: number; windowMs: number; message: string }) {
  const hits = new Map<string, { count: number; reset: number }>();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, opts.windowMs);
  timer.unref();

  const middleware = (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + opts.windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > opts.max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      throw new HttpError(429, opts.message);
    }
    next();
  };
  /** Clears the counter for this client, e.g. after a successful login. */
  middleware.reset = (req: Request) => hits.delete(req.ip ?? "unknown");
  return middleware;
}
