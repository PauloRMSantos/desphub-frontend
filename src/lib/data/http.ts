export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
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

export async function apiGet<T>(
  path: string,
  params?: Record<string, QueryValue>,
): Promise<T> {
  const res = await fetch(`/api${path}${buildQuery(params)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function apiSend<T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T | null> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `${method} ${path} failed (${res.status})`);
  }
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
    headers: { Accept: "application/json" },
    body: formData,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}
