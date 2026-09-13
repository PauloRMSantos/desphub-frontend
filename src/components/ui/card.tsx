import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hero?: boolean;
}

export function Card({ hero = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border shadow-card",
        hero
          ? "relative overflow-hidden border-transparent bg-[image:var(--deep-grad)] text-white shadow-deep"
          : "border-border bg-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function HeroGlow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute -right-[110px] -top-[130px] h-[260px] w-[260px] rounded-full",
        "bg-[radial-gradient(circle,rgba(231,107,22,0.5),transparent_70%)]",
        className,
      )}
    />
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-3 px-6 pb-3.5 pt-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-head text-[22px] font-bold tracking-[0.2px] text-text-1 whitespace-nowrap",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 py-[22px]", className)} {...props}>
      {children}
    </div>
  );
}
