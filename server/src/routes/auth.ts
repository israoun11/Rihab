import { Router } from "express";
import type { AppConfig } from "../config.js";
import { AdminUser } from "../models/index.js";
import { dummyVerify, verifyPassword } from "../lib/password.js";
import { badRequest, unauthorized } from "../lib/httpError.js";
import { csrfGuard, endSession, loadAdmin, startSession } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { loginSchema } from "../services/validation.js";

export function authRouter(cfg: AppConfig): Router {
  const r = Router();
  const limiter = rateLimit({
    max: cfg.loginMaxAttempts,
    windowMs: cfg.loginWindowMs,
    message: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
  });

  r.post("/login", csrfGuard, limiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("Indiquez votre e-mail et votre mot de passe.");
    const { email, password } = parsed.data;
    const user = await AdminUser.findOne({ email }).lean();
    if (!user) {
      await dummyVerify(password);
      throw unauthorized("E-mail ou mot de passe incorrect.");
    }
    if (!(await verifyPassword(password, user.passwordHash))) throw unauthorized("E-mail ou mot de passe incorrect.");
    limiter.reset(req);
    await startSession(res, String(user._id), cfg);
    res.json({ email: user.email });
  });

  r.post("/logout", csrfGuard, async (req, res) => {
    await endSession(req, res, cfg);
    res.status(204).end();
  });

  r.get("/me", async (req, res) => {
    const admin = await loadAdmin(req);
    res.setHeader("Cache-Control", "no-store");
    // 200 in both cases, so checking the session never logs an error in the browser console.
    res.json({ email: admin?.email ?? null });
  });

  return r;
}
