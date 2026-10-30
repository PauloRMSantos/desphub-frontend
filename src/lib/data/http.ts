export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const GENERIC_REASONS = new Set([
  "bad request",
  "unauthorized",
  "forbidden",
  "not found",
  "conflict",
  "unprocessable entity",
  "internal server error",
  "bad gateway",
  "service unavailable",
]);

const STATUS_FALLBACK: Record<number, string> = {
  400: "Dados inválidos. Revise os campos e tente novamente.",
  403: "Você não tem permissão para esta ação.",
  404: "Registro não encontrado.",
  409: "Este registro já existe ou está em uso.",
  422: "Não foi possível processar. Revise os dados informados.",
  429: "Muitas tentativas. Aguarde um instante e tente novamente.",
  500: "Erro interno no servidor. Tente novamente em instantes.",
  502: "Servidor indisponível. Tente novamente em instantes.",
  503: "Serviço temporariamente indisponível. Tente novamente.",
  504: "O servidor demorou para responder. Tente novamente.",
};

function isUsefulMessage(text: string): boolean {
  const lower = text.toLowerCase();
  if (GENERIC_REASONS.has(lower)) return false;
  if (lower.startsWith("validation failed")) return false;
  if (lower === "no message available") return false;
  return true;
}

function pickMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const errors = record.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const messages: string[] = [];
    for (const entry of errors) {
      if (typeof entry === "string" && entry.trim()) {
        messages.push(entry.trim());
      } else if (entry && typeof entry === "object") {
        const fieldError = entry as Record<string, unknown>;
        const text = fieldError.defaultMessage ?? fieldError.message;
        if (typeof text === "string" && text.trim()) {
          const field = fieldError.field;
          messages.push(
            typeof field === "string" && field
              ? `${field}: ${text.trim()}`
              : text.trim(),
          );
        }
      }
    }
    const unique = [...new Set(messages)];
    if (unique.length > 0) {
      const shown = unique.slice(0, 3).join("; ");
      return unique.length > 3 ? `${shown}…` : shown;
    }
  }
  for (const key of ["message", "detail", "error", "title"]) {
    const value = record[key];
    if (typeof value === "string") {
      const text = value.trim();
      if (text && isUsefulMessage(text)) return text;
    }
  }
  return undefined;
}

export function errorDetail(err: unknown): string | undefined {
  return err instanceof ApiError ? err.detail : undefined;
}

const TOKEN_KEY = "dh-token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function authHeaders(base: Record<string, string>): Record<string, string> {
  const headers = { ...base };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function handleUnauthorized(): void {
  setToken(null);
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

type QueryValue = string | number | boolean | null | undefined;

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      usp.append(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

async function fail(res: Response, label: string): Promise<never> {
  if (res.status === 401) handleUnauthorized();
  let detail: string | undefined;
  try {
    const raw = (await res.text()).trim();
    if (raw.startsWith("{") || raw.startsWith("[")) {
      detail = pickMessage(JSON.parse(raw));
    } else if (raw && raw.length <= 300) {
      detail = raw;
    }
  } catch {}
  const message = detail ?? STATUS_FALLBACK[res.status] ?? `${label} (${res.status})`;
  throw new ApiError(res.status, message, detail);
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, QueryValue>,
): Promise<T> {
  const res = await fetch(`/api${path}${buildQuery(params)}`, {
    headers: authHeaders({ Accept: "application/json" }),
  });
  if (!res.ok) await fail(res, `GET ${path} failed`);
  return (await res.json()) as T;
}

export async function apiSend<T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T | null> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: authHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) await fail(res, `${method} ${path} failed`);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}

export async function apiGetBlob(path: string): Promise<Blob> {
  const res = await fetch(`/api${path}`, {
    headers: authHeaders({}),
  });
  if (!res.ok) await fail(res, `GET ${path} failed`);
  return res.blob();
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: authHeaders({ Accept: "application/json" }),
    body: formData,
  });
  if (!res.ok) await fail(res, `POST ${path} failed`);
  return (await res.json()) as T;
}
