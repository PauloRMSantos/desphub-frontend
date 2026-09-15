import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex gap-[5px] rounded-pill bg-track p-[5px]",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-[7px] rounded-pill px-[18px] py-2.5 text-[13.5px] font-semibold transition-all duration-150",
              active
                ? "bg-card text-text-1 shadow-raise [&_svg]:text-orange"
                : "text-text-2 hover:text-text-1",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
