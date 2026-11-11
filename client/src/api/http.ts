export interface FieldIssue {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get issues(): FieldIssue[] {
    return Array.isArray(this.details) ? (this.details as FieldIssue[]) : [];
  }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

/** JSON fetch wrapper: same-origin cookies, CSRF header, French error messages. */
export async function api<T>(method: Method, url: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: "same-origin",
    headers: { "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
  };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(0, "Connexion au serveur impossible. Vérifiez votre connexion et réessayez.");
  }
  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; details?: unknown };
    throw new ApiError(res.status, d.error ?? `Erreur ${res.status}`, d.details);
  }
  return data as T;
}
