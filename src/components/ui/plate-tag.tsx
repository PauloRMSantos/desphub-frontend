import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PlateTag({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-mono text-[13px] font-semibold tracking-[0.5px] text-text-1",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
