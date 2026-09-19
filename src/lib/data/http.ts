export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
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
  throw new ApiError(res.status, `${label} (${res.status})`);
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
