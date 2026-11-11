import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = path.dirname(fileURLToPath(import.meta.url));
/** server/ directory, whether running from src (tsx) or dist (node). */
export const SERVER_ROOT = path.resolve(here, "..");
export const REPO_ROOT = path.resolve(SERVER_ROOT, "..");

// Load .env files without a dependency (Node >= 20.12). Real environment variables win.
for (const file of [path.join(REPO_ROOT, ".env"), path.join(SERVER_ROOT, ".env")]) {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

const bool = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI est obligatoire (voir .env.example)"),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(24 * 30).default(12),
  COOKIE_SECURE: bool.optional(),
  TRUST_PROXY: z.string().optional(),
  MAX_UPLOAD_MB: z.coerce.number().min(1).max(50).default(10),
  CLIENT_DIST: z.string().optional(),
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(10),
  LOGIN_WINDOW_MINUTES: z.coerce.number().int().min(1).default(15),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
  console.error(`Configuration invalide :\n${lines.join("\n")}`);
  process.exit(1);
}
const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === "production",
  port: env.PORT,
  mongoUri: env.MONGODB_URI,
  sessionTtlMs: env.SESSION_TTL_HOURS * 3600 * 1000,
  cookieSecure: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
  trustProxy: env.TRUST_PROXY,
  maxUploadBytes: Math.round(env.MAX_UPLOAD_MB * 1024 * 1024),
  clientDist: path.resolve(REPO_ROOT, env.CLIENT_DIST ?? "client/dist"),
  adminEmail: env.ADMIN_EMAIL,
  adminPassword: env.ADMIN_PASSWORD,
  loginMaxAttempts: env.LOGIN_MAX_ATTEMPTS,
  loginWindowMs: env.LOGIN_WINDOW_MINUTES * 60 * 1000,
} as const;

export type AppConfig = typeof config;
