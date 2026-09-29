"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { metaForPath } from "@/config/navigation";
import { useTopbarActions } from "./topbar-actions";
import { GlobalSearch } from "./global-search";
import { cn } from "@/lib/utils";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const meta = metaForPath(pathname);
  const actions = useTopbarActions();

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-start gap-x-3 gap-y-3 bg-[var(--topbar-bg)] px-4 pb-[18px] pt-5 backdrop-blur-[10px] sm:gap-x-[18px] sm:px-8 sm:pt-[26px]">
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={onMenu}
        className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-text-2 lg:hidden"
      >
        <Menu size={19} />
      </button>

      <div className="order-1 min-w-0 flex-1">
        <nav className="flex items-center gap-[7px] text-xs font-medium text-text-3">
          {meta.breadcrumb.map((crumb, i) => {
            const last = i === meta.breadcrumb.length - 1;
            return (
              <Fragment key={crumb}>
                {i > 0 && <ChevronRight size={12} />}
                <span className={cn(last && "font-bold text-text-1")}>
                  {crumb}
                </span>
              </Fragment>
            );
          })}
        </nav>
        <h1 className="mt-1.5 truncate font-head text-[28px] font-bold leading-[1] tracking-[0.2px] text-text-1 sm:text-[44px]">
          {meta.title}
        </h1>
        <p className="mt-[7px] hidden text-sm text-text-2 sm:block">
          {meta.subtitle}
        </p>
      </div>

      <div className="order-3 flex w-full flex-wrap items-center gap-2.5 sm:order-2 sm:ml-auto sm:w-auto sm:flex-nowrap sm:pt-1.5">
        <GlobalSearch />
        {actions}
      </div>
    </header>
  );
}
