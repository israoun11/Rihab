import type { NextFunction, Request, Response } from "express";
import { AdminUser, SessionModel } from "../models/index.js";
import { newToken, sha256 } from "../lib/password.js";
import { forbidden, unauthorized } from "../lib/httpError.js";
import type { AppConfig } from "../config.js";

export const SESSION_COOKIE = "rb_session";

export interface AdminIdentity {
  id: string;
  email: string;
  sessionHash: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminIdentity;
    }
  }
}

export async function startSession(res: Response, userId: string, cfg: AppConfig): Promise<void> {
  const token = newToken();
  await SessionModel.create({ tokenHash: sha256(token), userId, expiresAt: new Date(Date.now() + cfg.sessionTtlMs) });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cfg.cookieSecure,
    sameSite: "strict",
    path: "/",
    maxAge: cfg.sessionTtlMs,
  });
}

export async function endSession(req: Request, res: Response, cfg: AppConfig): Promise<void> {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string") await SessionModel.deleteOne({ tokenHash: sha256(token) });
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: cfg.cookieSecure, sameSite: "strict", path: "/" });
}

/** Loads the administrator from the session cookie, if any. */
export async function loadAdmin(req: Request): Promise<AdminIdentity | null> {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  const tokenHash = sha256(token);
  const session = await SessionModel.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).lean();
  if (!session) return null;
  const user = await AdminUser.findById(session.userId, { email: 1 }).lean();
  if (!user) return null;
  return { id: String(user._id), email: user.email, sessionHash: tokenHash };
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const admin = await loadAdmin(req);
  if (!admin) throw unauthorized("Votre session a expiré. Reconnectez-vous.");
  req.admin = admin;
  next();
}

/**
 * CSRF protection for state-changing requests: the session cookie is SameSite=Strict,
 * and every mutating call must carry a custom header that a cross-site form cannot set.
 * When the browser sends an Origin header, it must match the host.
 */
export function csrfGuard(req: Request, _res: Response, next: NextFunction): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get("x-requested-with") !== "XMLHttpRequest") throw forbidden("Requête refusée (en-tête de sécurité manquant).");
  const origin = req.get("origin");
  if (origin) {
    let host: string;
    try {
      host = new URL(origin).host;
    } catch {
      throw forbidden("Origine invalide.");
    }
    const expected = req.get("x-forwarded-host") ?? req.get("host");
    if (host !== expected) throw forbidden("Origine non autorisée.");
  }
  next();
}
