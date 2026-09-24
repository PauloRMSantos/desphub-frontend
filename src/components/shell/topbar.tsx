"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, Search } from "lucide-react";
import { metaForPath } from "@/config/navigation";
import { useTopbarActions } from "./topbar-actions";
import { cn } from "@/lib/utils";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const meta = metaForPath(pathname);
  const actions = useTopbarActions();

  return (
    <header className="sticky top-0 z-20 flex items-start gap-3 bg-[var(--topbar-bg)] px-4 pb-[18px] pt-5 backdrop-blur-[10px] sm:gap-[18px] sm:px-8 sm:pt-[26px]">
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={onMenu}
        className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-text-2 lg:hidden"
      >
        <Menu size={19} />
      </button>

      <div className="min-w-0 shrink">
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
        <h1 className="mt-1.5 truncate font-head text-[32px] font-bold leading-[0.98] tracking-[0.2px] text-text-1 sm:text-[44px]">
          {meta.title}
        </h1>
        <p className="mt-[7px] hidden text-sm text-text-2 sm:block">
          {meta.subtitle}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2.5 pt-1.5">
        <div className="hidden w-[244px] items-center gap-[9px] rounded-pill border border-border bg-card px-4 py-2.5 text-text-3 xl:flex">
          <Search size={17} className="shrink-0" />
          <input
            type="search"
            placeholder="Buscar OS, cliente, placa…"
            className="w-full border-none bg-transparent text-[13.5px] text-text-1 outline-none placeholder:text-text-3"
          />
        </div>
        {actions}
      </div>
    </header>
  );
}
