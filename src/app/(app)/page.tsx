"use client";

import Link from "next/link";
import { ArrowUpRight, CarFront, FileText, Plus } from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import {
  getServiceOrders,
  getClients,
  getVehicles,
  getBudgets,
} from "@/lib/data";
import { ORDER_STATUS, ORDER_FLOW, BUDGET_STATUS } from "@/config/status";
import { brl } from "@/lib/format";
import type { OrderStatus } from "@/types";
import { Card, CardBody } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart } from "@/components/charts/bar-chart";
import { Gauge } from "@/components/charts/gauge";
import { usePageActions } from "@/components/shell/topbar-actions";

function CircleLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border-[1.5px] border-border-strong text-text-2 transition-[background,color,border-color,transform] duration-150 hover:rotate-45 hover:border-orange hover:bg-orange hover:text-white"
    >
      <ArrowUpRight size={15} />
    </Link>
  );
}

function statusColor(status: OrderStatus): string {
  switch (status) {
    case "CONCLUIDA":
      return "var(--success)";
    case "AGUARDANDO_PAGAMENTO":
      return "var(--danger)";
    case "EM_ANDAMENTO":
      return "var(--warning)";
    default:
      return "var(--link-blue)";
  }
}

export default function DashboardPage() {
  usePageActions(
    () => (
      <>
        <Button variant="ghost" asChild>
          <Link href="/lookup">
            <CarFront size={17} />
            Nova consulta
          </Link>
        </Button>
        <Button asChild>
          <Link href="/orders">
            <Plus size={17} />
            Nova OS
          </Link>
        </Button>
      </>
    ),
    [],
  );

  const orders = useResource(getServiceOrders, []);
  const clients = useResource(getClients, []);
  const vehicles = useResource(getVehicles, []);
  const budgets = useResource(getBudgets, []);

  const orderList = orders.data ?? [];
  const clientList = clients.data ?? [];
  const budgetList = budgets.data ?? [];

  const clientName = (id: number) =>
    clientList.find((c) => c.id === id)?.name ?? `Cliente #${id}`;

  const openOrders = orderList.filter(
    (o) => o.orderStatus !== "CONCLUIDA",
  ).length;
  const completed = orderList.filter(
    (o) => o.orderStatus === "CONCLUIDA",
  ).length;
  const completedPct = orderList.length
    ? (completed / orderList.length) * 100
    : 0;

  const ordersByStatus = ORDER_FLOW.map((status) => ({
    status,
    label: ORDER_STATUS[status].label,
    value: orderList.filter((o) => o.orderStatus === status).length,
  }));

  return (
    <div className="fade-in flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {orders.loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardBody className="space-y-4">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-10 w-3/5" />
                <Skeleton className="h-3 w-4/5" />
              </CardBody>
            </Card>
          ))
        ) : (
          <>
            <KpiCard
              hero
              label="OS abertas"
              value={String(openOrders)}
              foot="Ordens em aberto"
              action={<CircleLink href="/orders" />}
            />
            <KpiCard
              label="Clientes"
              value={String(clientList.length)}
              foot="Base de clientes"
              action={<CircleLink href="/clients" />}
            />
            <KpiCard
              label="Veículos"
              value={String(vehicles.data?.length ?? 0)}
              foot="Frota cadastrada"
              action={<CircleLink href="/vehicles" />}
            />
            <KpiCard
              label="Orçamentos"
              value={String(budgetList.length)}
              foot="Propostas registradas"
              action={<CircleLink href="/finance" />}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-head text-[22px] font-bold text-text-1">
                  Ordens por status
                </span>
                <p className="mt-0.5 text-[12.5px] text-text-2">
                  Distribuição das ordens de serviço
                </p>
              </div>
              <CircleLink href="/orders" />
            </div>
            {orders.loading ? (
              <Skeleton className="mt-4 h-[210px] w-full" />
            ) : orderList.length > 0 ? (
              <BarChart className="mt-2" data={ordersByStatus} />
            ) : (
              <EmptyState
                icon={<FileText size={30} />}
                title="Nenhuma ordem de serviço"
                description="As OS criadas aparecerão aqui."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col">
            <span className="font-head text-[22px] font-bold text-text-1">
              Progresso das OS
            </span>
            {orders.loading ? (
              <Skeleton className="mx-auto mt-6 h-24 w-[168px]" />
            ) : (
              <>
                <Gauge percent={completedPct} />
                <div className="mt-3.5 flex flex-col gap-3">
                  {ordersByStatus.map((o) => (
                    <div
                      key={o.status}
                      className="flex items-center gap-2.5 text-[13px]"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded"
                        style={{ background: statusColor(o.status) }}
                      />
                      <span className="text-text-2">{o.label}</span>
                      <span className="ml-auto font-mono font-bold text-text-1">
                        {o.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-head text-[22px] font-bold text-text-1">
                Ordens recentes
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/orders">
                  <Plus size={14} />
                  Nova
                </Link>
              </Button>
            </div>
            {orders.loading ? (
              <ListSkeleton />
            ) : orderList.length > 0 ? (
              <div>
                {orderList.slice(0, 6).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                  >
                    <span
                      className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl"
                      style={{
                        background: "var(--info-bg)",
                        color: statusColor(o.orderStatus),
                      }}
                    >
                      <FileText size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-text-1">
                        {clientName(o.clientId)}
                      </div>
                      <div className="truncate font-mono text-[11.5px] text-text-3">
                        {o.code}
                      </div>
                    </div>
                    <Badge tone={ORDER_STATUS[o.orderStatus].tone}>
                      {ORDER_STATUS[o.orderStatus].label}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FileText size={30} />}
                title="Nenhuma ordem de serviço"
                description="As OS criadas aparecerão aqui."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-head text-[22px] font-bold text-text-1">
                Orçamentos recentes
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/finance">
                  <FileText size={14} />
                  Financeiro
                </Link>
              </Button>
            </div>
            {budgets.loading ? (
              <ListSkeleton />
            ) : budgetList.length > 0 ? (
              <div>
                {budgetList.slice(0, 6).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                  >
                    <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-surface-soft text-text-2">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-text-1">
                        {clientName(b.clientId)}
                      </div>
                      <div className="truncate font-mono text-[11.5px] text-text-3">
                        {b.code}
                      </div>
                    </div>
                    <span className="mr-1 font-mono text-[13.5px] font-semibold text-text-1">
                      {brl(b.totalPrice)}
                    </span>
                    <Badge tone={BUDGET_STATUS[b.status].tone}>
                      {BUDGET_STATUS[b.status].label}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FileText size={30} />}
                title="Nenhum orçamento"
                description="Os orçamentos criados aparecerão aqui."
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
