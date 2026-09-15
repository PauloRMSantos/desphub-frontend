import type { SeriesPoint } from "@/types";
import { cn } from "@/lib/utils";

interface BarChartProps {
  data: SeriesPoint[];
  showValues?: boolean;
  formatValue?: (value: number) => string;
  highlightLast?: boolean;
  className?: string;
  height?: number;
}

export function BarChart({
  data,
  showValues = false,
  formatValue = (v) => String(v),
  highlightLast = false,
  className,
  height = 210,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div
      className={cn("flex items-end gap-3 pt-2.5", className)}
      style={{ height }}
    >
      {data.map((point, i) => {
        const zero = point.value === 0;
        const isLast = i === data.length - 1;
        return (
          <div
            key={point.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2.5"
          >
            {showValues && !zero && (
              <span className="font-mono text-[11px] font-semibold text-text-2">
                {formatValue(point.value)}
              </span>
            )}
            <div className="flex h-full w-full items-end justify-center">
              <div
                className={cn(
                  "w-[78%] max-w-[54px] rounded-full transition-[height] duration-500",
                  zero
                    ? "border border-border bg-[image:var(--hatch)]"
                    : highlightLast && isLast
                      ? "bg-orange"
                      : "bg-chart-1",
                )}
                style={{
                  height: zero ? "14%" : `${(point.value / max) * 100}%`,
                  minHeight: zero ? undefined : 26,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-text-3">
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
