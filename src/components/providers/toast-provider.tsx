"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info" | "loading";

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
  kind: ToastKind;
}

interface ToastContextValue {
  show: (kind: ToastKind, options: ToastOptions) => string;
  success: (title: ReactNode, description?: ReactNode) => string;
  error: (title: ReactNode, description?: ReactNode) => string;
  info: (title: ReactNode, description?: ReactNode) => string;
  loading: (title: ReactNode, description?: ReactNode) => string;
  update: (id: string, kind: ToastKind, options: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastKind, number> = {
  success: 4000,
  info: 4500,
  error: 6000,
  loading: Number.POSITIVE_INFINITY,
};

let counter = 0;
const nextId = () => `t${++counter}`;

const MAX_TOASTS = 5;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setToasts((p) => p.filter((x) => x.id !== id));
  }, []);

  const schedule = useCallback(
    (id: string, duration: number) => {
      const old = timers.current.get(id);
      if (old) clearTimeout(old);
      if (Number.isFinite(duration)) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      } else {
        timers.current.delete(id);
      }
    },
    [dismiss],
  );

  const show = useCallback(
    (kind: ToastKind, options: ToastOptions) => {
      const id = nextId();
      const duration = options.duration ?? DEFAULT_DURATION[kind];
      setToasts((p) => {
        const next = [...p, { id, kind, ...options }];
        while (next.length > MAX_TOASTS) {
          const removed = next.shift();
          if (removed) {
            const t = timers.current.get(removed.id);
            if (t) clearTimeout(t);
            timers.current.delete(removed.id);
          }
        }
        return next;
      });
      schedule(id, duration);
      return id;
    },
    [schedule],
  );

  const update = useCallback(
    (id: string, kind: ToastKind, options: ToastOptions) => {
      const duration = options.duration ?? DEFAULT_DURATION[kind];
      setToasts((p) =>
        p.map((x) => (x.id === id ? { ...x, kind, ...options } : x)),
      );
      schedule(id, duration);
    },
    [schedule],
  );

  const success = useCallback(
    (title: ReactNode, description?: ReactNode) =>
      show("success", { title, description }),
    [show],
  );
  const error = useCallback(
    (title: ReactNode, description?: ReactNode) =>
      show("error", { title, description }),
    [show],
  );
  const info = useCallback(
    (title: ReactNode, description?: ReactNode) =>
      show("info", { title, description }),
    [show],
  );
  const loading = useCallback(
    (title: ReactNode, description?: ReactNode) =>
      show("loading", { title, description }),
    [show],
  );

  return (
    <ToastContext.Provider
      value={{ show, success, error, info, loading, update, dismiss }}
    >
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2.5">
            {toasts.map((t) => (
              <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: () => void;
}) {
  const accent =
    toast.kind === "success"
      ? "text-success"
      : toast.kind === "error"
        ? "text-danger"
        : "text-link-blue";

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-menu p-3.5 shadow-pop [animation:toastIn_.18s_ease-out]"
    >
      <span className={cn("mt-0.5 shrink-0", accent)}>
        {toast.kind === "loading" ? (
          <Spinner size={18} />
        ) : toast.kind === "success" ? (
          <CheckCircle2 size={19} />
        ) : toast.kind === "error" ? (
          <AlertTriangle size={19} />
        ) : (
          <Info size={19} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold text-text-1">{toast.title}</div>
        {toast.description && (
          <div className="mt-0.5 text-[12.5px] leading-snug text-text-2">
            {toast.description}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-text-3 hover:bg-surface-soft hover:text-text-1"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
