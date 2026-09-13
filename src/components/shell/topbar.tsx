"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Search } from "lucide-react";
import { metaForPath } from "@/config/navigation";
import { useTopbarActions } from "./topbar-actions";
import { cn } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const meta = metaForPath(pathname);
  const actions = useTopbarActions();

  return (
    <header className="sticky top-0 z-20 flex items-start gap-[18px] bg-[var(--topbar-bg)] px-8 pb-[18px] pt-[26px] backdrop-blur-[10px]">
      <div className="shrink-0">
        <nav className="flex items-center gap-[7px] text-xs font-medium text-text-3">
          {meta.breadcrumb.map((crumb, i) => {
            const last = i === meta.breadcrumb.length - 1;
            return (
              <Fragment key={crumb}>
                {i > 0 && <ChevronRight size={12} />}
                <span
                  className={cn(last && "font-bold text-text-1")}
                >
                  {crumb}
                </span>
              </Fragment>
            );
          })}
        </nav>
        <h1 className="mt-1.5 whitespace-nowrap font-head text-[44px] font-bold leading-[0.98] tracking-[0.2px] text-text-1">
          {meta.title}
        </h1>
        <p className="mt-[7px] text-sm text-text-2">{meta.subtitle}</p>
      </div>

      <div className="ml-auto flex items-center gap-2.5 pt-1.5">
        <div className="flex w-[244px] items-center gap-[9px] rounded-pill border border-border bg-card px-4 py-2.5 text-text-3">
          <Search size={17} className="shrink-0" />
          <input
            type="search"
            placeholder="Buscar OS, cliente, placa…"
            className="w-full border-none bg-transparent text-[13.5px] text-text-1 outline-none placeholder:text-text-3"
          />
        </div>
        <button
          type="button"
          title="Notificações"
          className="relative grid h-[42px] w-[42px] place-items-center rounded-full border border-border bg-card text-text-2 transition-colors hover:border-border-strong hover:text-orange"
        >
          <Bell size={19} />
          <span className="absolute right-2.5 top-[9px] h-[7px] w-[7px] rounded-full border-[1.5px] border-card bg-orange" />
        </button>
        {actions}
      </div>
    </header>
  );
}
