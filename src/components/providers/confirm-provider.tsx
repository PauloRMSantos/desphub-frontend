"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type Tone = "default" | "danger";

interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: Tone;
}

interface NotifyOptions {
  title?: string;
  message: ReactNode;
  confirmText?: string;
  tone?: Tone;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (options: NotifyOptions) => Promise<void>;
}

interface InternalState extends ConfirmOptions {
  variant: "confirm" | "alert";
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<InternalState>({
    message: "",
    variant: "confirm",
  });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    setOpen(false);
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ tone: "default", ...options, variant: "confirm" });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const notify = useCallback((options: NotifyOptions) => {
    setState({ tone: "default", ...options, variant: "alert" });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    }).then(() => undefined);
  }, []);

  const isAlert = state.variant === "alert";
  const isDanger = state.tone === "danger";

  return (
    <ConfirmContext.Provider value={{ confirm, notify }}>
      {children}
      <Modal
        open={open}
        onClose={() => close(false)}
        size="sm"
        title={state.title ?? (isAlert ? "Aviso" : "Confirmação")}
        icon={
          isDanger ? (
            <AlertTriangle size={18} className="text-danger" />
          ) : (
            <Info size={18} className="text-link-blue" />
          )
        }
        footer={
          <>
            {!isAlert && (
              <Button variant="ghost" onClick={() => close(false)}>
                {state.cancelText ?? "Cancelar"}
              </Button>
            )}
            <Button
              onClick={() => close(true)}
              className={
                isDanger
                  ? "border-transparent bg-danger text-white hover:brightness-110"
                  : undefined
              }
            >
              {state.confirmText ?? (isAlert ? "OK" : "Confirmar")}
            </Button>
          </>
        }
      >
        {state.message}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
