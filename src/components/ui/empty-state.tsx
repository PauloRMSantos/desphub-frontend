import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3.5 px-5 py-16 text-center text-text-3",
        className,
      )}
    >
      {icon && (
        <span className="grid h-[60px] w-[60px] place-items-center rounded-[18px] bg-orange-50 text-orange-ink">
          {icon}
        </span>
      )}
      <div>
        <div className="font-head text-2xl font-bold text-text-1">{title}</div>
        {description && (
          <p className="mt-1.5 max-w-sm text-[13.5px] text-text-3">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
