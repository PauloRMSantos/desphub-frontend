import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type FieldState = "default" | "ok" | "error";

const fieldBase =
  "w-full rounded-input border px-3.5 py-3 text-sm text-text-1 bg-input outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#a9b2be]";

const stateStyles: Record<FieldState, string> = {
  default:
    "border-border-strong focus:border-orange focus:shadow-[0_0_0_3.5px_var(--orange-50)]",
  ok: "border-success shadow-[0_0_0_3.5px_rgba(22,163,74,0.1)]",
  error: "border-danger shadow-[0_0_0_3.5px_rgba(200,16,46,0.1)]",
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
  state?: FieldState;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ mono = false, state = "default", className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        fieldBase,
        stateStyles[state],
        mono && "font-mono tracking-[0.5px]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { fieldBase, stateStyles };
