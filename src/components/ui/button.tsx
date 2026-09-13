import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary" 
  | "blue" 
  | "ghost" 
  | "soft" 
  | "hero"; 

type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-semibold leading-none whitespace-nowrap border border-transparent transition-[background,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-orange-ink text-white shadow-[0_2px_10px_rgba(180,82,12,0.28)] hover:bg-[var(--orange-ink-hover)]",
  blue: "bg-deep text-white hover:bg-deep-2",
  ghost:
    "bg-card text-text-1 border-border-strong hover:bg-surface-soft",
  soft: "bg-blue-50 text-link-blue hover:bg-[#dfeaf7]",
  hero: "bg-white text-deep hover:bg-[#f0f3f7]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-[9px] text-[12.5px] gap-1.5",
  md: "px-5 py-3 text-sm",
  lg: "px-[26px] py-[15px] text-[15.5px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", block = false, className, type, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          block && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
