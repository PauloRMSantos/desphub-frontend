import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function FilterChip({
  active = false,
  className,
  children,
  ...props
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-[15px] py-[9px] text-[12.5px] font-semibold transition-all duration-150",
        active
          ? "border-deep bg-deep text-white"
          : "border-border-strong bg-input text-text-2 hover:border-border-strong hover:bg-surface-soft hover:text-text-1",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
