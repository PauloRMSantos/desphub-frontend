"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const width =
    size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fade-in w-full overflow-hidden rounded-card border border-border bg-card shadow-pop",
          width,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || icon) && (
          <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
            {icon}
            <span className="font-head text-[17px] font-bold text-text-1">
              {title}
            </span>
            <button
              type="button"
              aria-label="Fechar"
              onClick={onClose}
              className="ml-auto grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-surface-soft hover:text-text-1"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="px-5 py-4 text-[13.5px] leading-relaxed text-text-2">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-2.5 border-t border-border px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
