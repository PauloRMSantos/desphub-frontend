import {
  LayoutDashboard,
  Users,
  Car,
  CarFront,
  FileText,
  Wallet,
  Settings,
  UserCog,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
  adminOnly?: boolean;
  officeScoped?: boolean;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Menu",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
        officeScoped: true,
      },
      {
        href: "/clients",
        label: "Clientes",
        icon: Users,
        permission: "CLIENTS_READ",
        officeScoped: true,
      },
      {
        href: "/vehicles",
        label: "Veículos",
        icon: Car,
        permission: "VEHICLES_READ",
        officeScoped: true,
      },
      {
        href: "/lookup",
        label: "Consulta de Veículo",
        icon: CarFront,
        permission: "VEHICLE_QUERY",
        officeScoped: true,
      },
      {
        href: "/orders",
        label: "Ordens de Serviço",
        icon: FileText,
        permission: "SERVICE_ORDERS_READ",
        officeScoped: true,
      },
      {
        href: "/finance",
        label: "Financeiro",
        icon: Wallet,
        permission: "BUDGETS_READ",
        officeScoped: true,
      },
    ],
  },
  {
    label: "Geral",
    items: [
      { href: "/settings", label: "Configurações", icon: Settings },
      {
        href: "/users",
        label: "Usuários",
        icon: UserCog,
        permission: "USERS_MANAGE",
      },
      {
        href: "/offices",
        label: "Escritórios",
        icon: Building2,
        adminOnly: true,
      },
    ],
  },
];

export interface PageMeta {
  title: string;
  subtitle: string;
  breadcrumb: string[];
}

export const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "Dashboard",
    subtitle: "Acompanhe prazos, consultas e caixa do escritório.",
    breadcrumb: ["Início"],
  },
  "/clients": {
    title: "Clientes",
    subtitle: "Cadastro de pessoas físicas e jurídicas.",
    breadcrumb: ["Cadastros", "Clientes"],
  },
  "/vehicles": {
    title: "Veículos",
    subtitle: "Frota e veículos vinculados aos clientes.",
    breadcrumb: ["Cadastros", "Veículos"],
  },
  "/lookup": {
    title: "Consulta de Veículo",
    subtitle: "Busca automatizada por placa e RENAVAM.",
    breadcrumb: ["Operação", "Consulta"],
  },
  "/orders": {
    title: "Ordens de Serviço",
    subtitle: "Criação, acompanhamento e impressão de OS.",
    breadcrumb: ["Operação", "Ordens de Serviço"],
  },
  "/finance": {
    title: "Financeiro",
    subtitle: "Receitas, pendências e orçamentos.",
    breadcrumb: ["Gestão", "Financeiro"],
  },
  "/settings": {
    title: "Configurações",
    subtitle: "Preferências do sistema e da conta.",
    breadcrumb: ["Sistema", "Configurações"],
  },
  "/users": {
    title: "Usuários",
    subtitle: "Gerencie os usuários e permissões do escritório.",
    breadcrumb: ["Sistema", "Usuários"],
  },
  "/offices": {
    title: "Escritórios",
    subtitle: "Cadastro e gestão de escritórios.",
    breadcrumb: ["Sistema", "Escritórios"],
  },
};

export function isOfficeScopedPath(pathname: string): boolean {
  return NAV_GROUPS.flatMap((g) => g.items)
    .filter((i) => i.officeScoped)
    .some((i) =>
      i.href === "/"
        ? pathname === "/"
        : pathname === i.href || pathname.startsWith(i.href + "/"),
    );
}

export function metaForPath(pathname: string): PageMeta {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const match = Object.keys(PAGE_META)
    .filter((p) => p !== "/" && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_META[match] : PAGE_META["/"];
}
