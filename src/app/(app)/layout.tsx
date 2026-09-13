import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { TopbarActionsProvider } from "@/components/shell/topbar-actions";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TopbarActionsProvider>
      <div className="grid h-dvh grid-cols-[var(--sidebar-w)_1fr] overflow-hidden bg-app">
        <Sidebar />
        <main className="flex h-full flex-col overflow-y-auto">
          <Topbar />
          <div className="flex-1 px-8 pb-11 pt-2">{children}</div>
        </main>
      </div>
    </TopbarActionsProvider>
  );
}
