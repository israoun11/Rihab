import { useState, type FormEvent } from "react";
import { ApiError } from "../api/http";
import { adminApi } from "./api";

export function Login({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Indiquez votre e-mail et votre mot de passe.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const me = await adminApi.login(email.trim(), password);
      onLogin(me.email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="a-login">
      <form className="a-login__box" onSubmit={submit} noValidate>
        <p className="a-brand">
          Rihab Baabou<i aria-hidden="true"></i>
        </p>
        <h1>Espace d’administration</h1>
        {error && (
          <p className="a-error" role="alert">
            {error}
          </p>
        )}
        <div className="a-field">
          <label className="a-label" htmlFor="login-email">
            Adresse e-mail
          </label>
          <input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="a-field">
          <label className="a-label" htmlFor="login-password">
            Mot de passe
          </label>
          <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="a-btn a-btn--primary a-btn--block" type="submit" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"}
        </button>
        <a className="a-help a-login__back" href="/">
          ← Retour au site
        </a>
      </form>
    </main>
  );
}
