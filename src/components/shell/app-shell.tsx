"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TopbarActionsProvider } from "./topbar-actions";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <TopbarActionsProvider>
      <div className="flex h-dvh overflow-hidden bg-app">
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[258px] transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar />
        </div>

        {open && (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <main className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
          <Topbar onMenu={() => setOpen(true)} />
          <div className="flex-1 px-4 pb-11 pt-2 sm:px-8">{children}</div>
        </main>
      </div>
    </TopbarActionsProvider>
  );
}
