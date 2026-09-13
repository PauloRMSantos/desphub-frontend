import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CircleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onDark?: boolean;
}

export const CircleButton = forwardRef<HTMLButtonElement, CircleButtonProps>(
  ({ onDark = false, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border-[1.5px] bg-transparent transition-[background,color,border-color,transform] duration-150",
        onDark
          ? "border-white/[0.34] text-white hover:rotate-45 hover:border-white hover:bg-white hover:text-deep"
          : "border-border-strong text-text-2 hover:rotate-45 hover:border-orange hover:bg-orange hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
CircleButton.displayName = "CircleButton";
