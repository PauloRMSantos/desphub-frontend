const COURIER_TIMEOUT = 15000;

type ExtReply = {
  __desphubExt?: true;
  id?: string;
  type?: string;
  payload?: unknown;
};

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function onCourierReady(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: MessageEvent) => {
    if (event.source !== window) return;
    const msg = event.data as ExtReply;
    if (msg && msg.__desphubExt === true) callback();
  };
  window.addEventListener("message", handler);
  window.postMessage({ __desphub: true, id: newId(), type: "GET_GOVBR_STATUS" }, window.location.origin);
  return () => window.removeEventListener("message", handler);
}

function request<T>(
  type: string,
  extra: Record<string, unknown> = {},
  timeoutMs: number = COURIER_TIMEOUT,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("sem window"));
      return;
    }
    const id = newId();
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Extensão não respondeu. Ela está instalada?"));
    }, timeoutMs);

    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      const msg = event.data as ExtReply;
      if (!msg || msg.__desphubExt !== true || msg.id !== id) return;
      window.clearTimeout(timer);
      window.removeEventListener("message", handler);
      if (msg.type === "ERROR") {
        reject(new Error(String((msg.payload as { error?: string })?.error ?? "erro")));
      } else {
        resolve(msg.payload as T);
      }
    };

    window.addEventListener("message", handler);
    window.postMessage({ __desphub: true, id, type, ...extra }, window.location.origin);
  });
}

export function armCapture(
  pairingToken: string,
  backendUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  return request<{ ok: boolean; error?: string }>("ARM_GOVBR_CAPTURE", {
    pairingToken,
    backendUrl,
  });
}

// Drives the DETRAN-SC consulta page in the broker's browser and returns the
// raw dossiê JSON (which the caller then POSTs to the backend as
// { plate, state: "SC", payload }). Longer timeout: the query runs a real
// browser form submit + network round-trip.
export function runScQuery(
  plate: string,
  renavam: string,
): Promise<{ ok: boolean; payload?: unknown; error?: string }> {
  return request<{ ok: boolean; payload?: unknown; error?: string }>(
    "RUN_SC_QUERY",
    { plate, renavam },
    45000,
  );
}

// Opens a dedicated DETRAN-SC window for the broker to log in via gov.br (SC is
// a SEPARATE portal from RS). That window becomes the reusable worker for SC
// queries; the broker minimizes it. Call this when runScQuery returns
// error "sc-not-connected".
export function connectSc(): Promise<{ ok: boolean; reused?: boolean }> {
  return request<{ ok: boolean; reused?: boolean }>("CONNECT_SC");
}

// Whether a logged-in DETRAN-SC worker tab exists.
export function scStatus(): Promise<{ connected: boolean }> {
  return request<{ connected: boolean }>("SC_STATUS");
}

// Polls scStatus until the broker finishes logging into DETRAN-SC (or times out).
// Use after connectSc() to continue the query automatically once logged in.
export async function waitScConnected(timeoutMs = 180000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await scStatus()).connected) return true;
    } catch {
      /* extension busy; keep polling */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}
