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

function request<T>(type: string, extra: Record<string, unknown> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("sem window"));
      return;
    }
    const id = newId();
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Extensão não respondeu. Ela está instalada?"));
    }, COURIER_TIMEOUT);

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
