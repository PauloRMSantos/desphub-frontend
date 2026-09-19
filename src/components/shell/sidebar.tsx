"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, LogOut } from "lucide-react";
import { NAV_GROUPS, type NavItem } from "@/config/navigation";
import { useTheme } from "@/components/theme/theme-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, initials } from "@/components/ui/avatar";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<Role, string> = {
  DESPHUB_ADMIN: "Administrador",
  OFFICE_OWNER: "Dono do escritório",
  EMPLOYEE: "Funcionário",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, can, isAdmin } = useAuth();

  const visible = (item: NavItem) => {
    if (item.adminOnly) return isAdmin;
    if (item.permission) return can(item.permission);
    return true;
  };

  return (
    <aside className="flex h-full flex-col border-r border-border bg-sidebar px-3.5 pb-3.5">
      <div className="px-2 pb-[26px] pt-[22px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/desphub-logo-horizontal.svg"
          alt="DespHub"
          className="h-9 w-auto dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/desphub-logo-reverse.svg"
          alt="DespHub"
          className="hidden h-9 w-auto dark:block"
        />
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => {
          const items = group.items.filter(visible);
          if (items.length === 0) return null;
          return (
            <div key={group.label} className={cn(gi > 0 && "pt-[22px]")}>
              <div className="px-2.5 pb-2.5 text-[10.5px] font-bold uppercase tracking-[1.6px] text-text-3">
                {group.label}
              </div>
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative mb-[3px] flex w-full items-center gap-[13px] rounded-[13px] px-3 py-[11px] text-[14.5px] transition-[background,color,box-shadow] duration-150",
                      active
                        ? "bg-sidebar-active font-bold text-text-1 shadow-raise [&_svg]:text-orange"
                        : "font-medium text-text-2 hover:bg-sidebar-hover hover:text-text-1 [&_svg]:text-text-3 hover:[&_svg]:text-text-2",
                    )}
                  >
                    {active && (
                      <span className="absolute -left-3.5 bottom-2.5 top-2.5 w-1 rounded-r bg-orange" />
                    )}
                    <Icon size={21} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}

        <button
          type="button"
          onClick={toggleTheme}
          className="relative mb-[3px] mt-[3px] flex w-full items-center gap-[13px] rounded-[13px] px-3 py-[11px] text-[14.5px] font-medium text-text-2 transition-colors duration-150 hover:bg-sidebar-hover hover:text-text-1 [&_svg]:text-text-3 hover:[&_svg]:text-text-2"
        >
          {theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}
          <span>{theme === "dark" ? "Tema claro" : "Tema escuro"}</span>
        </button>
      </nav>

      <div className="flex items-center gap-[11px] border-t border-border px-2 pb-1 pt-3">
        <Avatar>{initials(user?.name ?? "")}</Avatar>
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-bold leading-tight text-text-1">
            {user?.name ?? "Minha conta"}
          </div>
          <div className="text-[11.5px] text-text-3">
            {user ? ROLE_LABEL[user.role] : ""}
          </div>
        </div>
        <button
          type="button"
          title="Sair"
          aria-label="Sair"
          onClick={logout}
          className="ml-auto grid h-8 w-8 place-items-center rounded-[10px] text-text-3 transition-colors hover:bg-sidebar-hover hover:text-orange"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
