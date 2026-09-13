import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-[7px]", className)} {...props}>
      {children}
    </div>
  );
}

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn("text-[12.5px] font-semibold text-text-2", className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-orange">*</span>}
    </label>
  );
}

export function Hint({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-[11.5px] text-text-3", className)} {...props}>
      {children}
    </p>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-[5px] text-[11.5px] font-medium text-danger">
      <AlertTriangle size={13} />
      {children}
    </div>
  );
}

export function OkText({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-[5px] text-[11.5px] font-semibold text-success">
      <CheckCircle2 size={15} />
      {children}
    </div>
  );
}

export function FieldsetLabel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-0.5 flex items-center gap-2 font-head text-[15px] font-bold uppercase tracking-[0.8px] text-text-1 [&_svg]:text-orange",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-border", className)} />;
}
