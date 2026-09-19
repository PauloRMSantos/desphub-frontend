import type { Permission } from "@/types";

export const PERMISSION_GROUPS: {
  label: string;
  items: { value: Permission; label: string }[];
}[] = [
  {
    label: "Clientes",
    items: [
      { value: "CLIENTS_READ", label: "Ver" },
      { value: "CLIENTS_WRITE", label: "Editar" },
    ],
  },
  {
    label: "Veículos",
    items: [
      { value: "VEHICLES_READ", label: "Ver" },
      { value: "VEHICLES_WRITE", label: "Editar" },
      { value: "NFE_IMPORT", label: "Importar NF-e" },
    ],
  },
  {
    label: "Serviços",
    items: [
      { value: "SERVICES_READ", label: "Ver" },
      { value: "SERVICES_WRITE", label: "Editar" },
    ],
  },
  {
    label: "Orçamentos",
    items: [
      { value: "BUDGETS_READ", label: "Ver" },
      { value: "BUDGETS_WRITE", label: "Editar" },
    ],
  },
  {
    label: "Ordens de serviço",
    items: [
      { value: "SERVICE_ORDERS_READ", label: "Ver" },
      { value: "SERVICE_ORDERS_WRITE", label: "Editar" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { value: "FINANCIAL_READ", label: "Ver" },
      { value: "FINANCIAL_WRITE", label: "Editar" },
    ],
  },
  {
    label: "Operação",
    items: [
      { value: "VEHICLE_QUERY", label: "Consulta DETRAN" },
      { value: "USERS_MANAGE", label: "Gerenciar usuários" },
    ],
  },
];
