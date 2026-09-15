import type { BadgeTone } from "@/components/ui/badge";
import type { BudgetStatus, OrderStatus } from "@/types";

export interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

export const ORDER_STATUS: Record<OrderStatus, StatusMeta> = {
  ABERTA: { label: "Aberta", tone: "info" },
  EM_ANDAMENTO: { label: "Em andamento", tone: "warning" },
  AGUARDANDO_PAGAMENTO: { label: "Aguardando pagamento", tone: "danger" },
  CONCLUIDA: { label: "Concluída", tone: "success" },
};

export const ORDER_FLOW: OrderStatus[] = [
  "ABERTA",
  "EM_ANDAMENTO",
  "AGUARDANDO_PAGAMENTO",
  "CONCLUIDA",
];

export const BUDGET_STATUS: Record<BudgetStatus, StatusMeta> = {
  PENDENTE: { label: "Pendente", tone: "warning" },
  APROVADO: { label: "Aprovado", tone: "success" },
  RECUSADO: { label: "Recusado", tone: "danger" },
};
