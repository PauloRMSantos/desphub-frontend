import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  success: { badge: "bg-success-bg text-badge-success-fg", dot: "bg-success" },
  warning: { badge: "bg-warning-bg text-badge-warning-fg", dot: "bg-warning" },
  danger: { badge: "bg-danger-bg text-badge-danger-fg", dot: "bg-danger" },
  info: { badge: "bg-info-bg text-badge-info-fg", dot: "bg-link-blue" },
  neutral: { badge: "bg-neutral-bg text-badge-neutral-fg", dot: "bg-neutral" },
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({
  tone = "neutral",
  dot = true,
  className,
  children,
  ...props
}: BadgeProps) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-badge px-[11px] py-[5px] text-xs font-semibold leading-none whitespace-nowrap",
        t.badge,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}
