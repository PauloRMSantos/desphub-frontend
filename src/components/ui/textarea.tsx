import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldBase, stateStyles, type FieldState } from "./input";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  state?: FieldState;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ state = "default", className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        fieldBase,
        stateStyles[state],
        "min-h-[88px] resize-y",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
