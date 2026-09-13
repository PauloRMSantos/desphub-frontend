import { cn } from "@/lib/utils";

export function Spinner({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-border-strong border-t-orange",
        className,
      )}
    />
  );
}
