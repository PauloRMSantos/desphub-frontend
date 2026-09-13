import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Avatar({ className, children, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        "grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-[image:var(--deep-grad)] text-[13.5px] font-bold text-white",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
