import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroGlow } from "./card";

interface KpiCardProps {
  label: string;
  value: string;
  currency?: string;
  chip?: string;
  up?: boolean;
  foot?: string;
  hero?: boolean;
  action?: ReactNode;
}

export function KpiCard({
  label,
  value,
  currency,
  chip,
  up = true,
  foot,
  hero = false,
  action,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card px-6 pb-5 pt-[22px] shadow-card",
        hero
          ? "border border-transparent bg-[image:var(--deep-grad)] shadow-deep"
          : "border border-border bg-card",
      )}
    >
      {hero && <HeroGlow />}
      <div className="relative flex items-start justify-between gap-3">
        <span
          className={cn(
            "font-head text-[19px] font-bold leading-[1.1] tracking-[0.2px]",
            hero ? "text-white" : "text-text-1",
          )}
        >
          {label}
        </span>
        {action}
      </div>

      <div
        className={cn(
          "relative mt-[18px] font-head text-[54px] font-bold leading-[0.95] tracking-[0.5px]",
          hero ? "text-white" : "text-text-1",
        )}
      >
        {currency && (
          <span className="mr-1 text-2xl font-semibold text-text-3">
            {currency}
          </span>
        )}
        {value}
      </div>

      {(chip || foot) && (
        <div
          className={cn(
            "relative mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold",
            hero ? "text-on-dark-dim" : "text-text-2",
          )}
        >
          {chip && (
            <span
              className={cn(
                "inline-flex items-center gap-[3px] rounded-md px-[7px] py-[3px] font-mono text-[11px] font-bold",
                hero
                  ? "bg-orange/[0.28] text-[#FFD2AC]"
                  : up
                    ? "bg-success-bg text-badge-success-fg"
                    : "bg-danger-bg text-badge-danger-fg",
              )}
            >
              {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              {chip}
            </span>
          )}
          {foot}
        </div>
      )}
    </div>
  );
}
