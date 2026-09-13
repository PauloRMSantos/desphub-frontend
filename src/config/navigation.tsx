import {
  LayoutDashboard,
  Users,
  Car,
  CarFront,
  FileText,
  Wallet,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Primary navigation groups shown in the sidebar. */
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Menu",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/veiculos", label: "Veículos", icon: Car },
      { href: "/consulta", label: "Consulta de Veículo", icon: CarFront },
      { href: "/os", label: "Ordens de Serviço", icon: FileText },
      { href: "/financeiro", label: "Financeiro", icon: Wallet },
    ],
  },
  {
    label: "Geral",
    items: [{ href: "/configuracoes", label: "Configurações", icon: Settings }],
  },
];

export interface PageMeta {
  title: string;
  subtitle: string;
  breadcrumb: string[];
}

/** Topbar metadata per route. */
export const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "Dashboard",
    subtitle: "Acompanhe prazos, consultas e caixa do escritório.",
    breadcrumb: ["Início"],
  },
  "/clientes": {
    title: "Clientes",
    subtitle: "Cadastro de pessoas físicas e jurídicas.",
    breadcrumb: ["Cadastros", "Clientes"],
  },
  "/veiculos": {
    title: "Veículos",
    subtitle: "Frota e veículos vinculados aos clientes.",
    breadcrumb: ["Cadastros", "Veículos"],
  },
  "/consulta": {
    title: "Consulta de Veículo",
    subtitle: "Busca automatizada por placa e RENAVAM.",
    breadcrumb: ["Operação", "Consulta"],
  },
  "/os": {
    title: "Ordens de Serviço",
    subtitle: "Criação, acompanhamento e impressão de OS.",
    breadcrumb: ["Operação", "Ordens de Serviço"],
  },
  "/financeiro": {
    title: "Financeiro",
    subtitle: "Receitas, pendências e orçamentos.",
    breadcrumb: ["Gestão", "Financeiro"],
  },
  "/configuracoes": {
    title: "Configurações",
    subtitle: "Preferências do sistema e da conta.",
    breadcrumb: ["Sistema", "Configurações"],
  },
};

/** Resolve the meta for a pathname, matching the deepest known prefix. */
export function metaForPath(pathname: string): PageMeta {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const match = Object.keys(PAGE_META)
    .filter((p) => p !== "/" && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_META[match] : PAGE_META["/"];
}
