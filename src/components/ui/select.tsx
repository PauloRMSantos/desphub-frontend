import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldBase, stateStyles, type FieldState } from "./input";

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  state?: FieldState;
}

const chevronBg =
  "bg-[right_13px_center] bg-no-repeat pr-9 appearance-none " +
  "bg-[image:url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%235A6472%22%20stroke-width=%222.2%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpolyline%20points=%226%209%2012%2015%2018%209%22/%3E%3C/svg%3E')]";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ state = "default", className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(fieldBase, stateStyles[state], chevronBg, className)}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
