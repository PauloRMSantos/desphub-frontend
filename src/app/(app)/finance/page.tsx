"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  FileText,
  ChartColumn,
  Check,
  Trash2,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import {
  getBudgets,
  getClients,
  getServices,
  createBudget,
  updateBudget,
} from "@/lib/data";
import type {
  Budget,
  BudgetStatus,
  Client,
  Service,
  CreateBudgetItemDTO,
} from "@/types";
import { BUDGET_STATUS } from "@/config/status";
import { brl } from "@/lib/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { Segmented } from "@/components/ui/segmented";
import { KpiCard } from "@/components/ui/kpi-card";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { BarChart } from "@/components/charts/bar-chart";
import { usePageActions } from "@/components/shell/topbar-actions";

const STATUS_LIST: BudgetStatus[] = ["PENDENTE", "APROVADO", "RECUSADO"];

export default function FinancePage() {
  const budgets = useResource(getBudgets, []);
  const clients = useResource(getClients, []);
  const services = useResource(getServices, []);
  const [tab, setTab] = useState<"overview" | "budgets">("overview");
  const [creating, setCreating] = useState(false);

  usePageActions(
    () => (
      <Button
        onClick={() => {
          setTab("budgets");
          setCreating(true);
        }}
      >
        <Plus size={17} />
        Novo orçamento
      </Button>
    ),
    [],
  );

  const clientName = (id: number) =>
    clients.data?.find((c) => c.id === id)?.name ?? `#${id}`;

  const list = budgets.data ?? [];

  if (creating) {
    return (
      <BudgetForm
        clients={clients.data ?? []}
        services={services.data ?? []}
        onDone={() => {
          budgets.reload();
          setCreating(false);
        }}
        onCancel={() => setCreating(false)}
      />
    );
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          {
            value: "overview",
            label: "Visão geral",
            icon: <ChartColumn size={16} />,
          },
          { value: "budgets", label: "Orçamentos", icon: <FileText size={16} /> },
        ]}
      />

      {tab === "overview" ? (
        <Overview budgets={list} loading={budgets.loading} />
      ) : (
        <BudgetList
          budgets={list}
          loading={budgets.loading}
          error={!!budgets.error}
          clientName={clientName}
          onReload={budgets.reload}
          onUpdateStatus={async (b, status) => {
            await updateBudget(b.id, {
              code: b.code,
              status,
              clientId: b.clientId,
              totalPrice: b.totalPrice,
              items: b.items.map((it) => ({
                serviceId: it.serviceId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
              })),
            });
            budgets.reload();
          }}
        />
      )}
    </div>
  );
}

function Overview({
  budgets,
  loading,
}: {
  budgets: Budget[];
  loading: boolean;
}) {
  const count = (s: BudgetStatus) =>
    budgets.filter((b) => b.status === s).length;
  const approvedValue = budgets
    .filter((b) => b.status === "APROVADO")
    .reduce((acc, b) => acc + b.totalPrice, 0);

  const byStatus = STATUS_LIST.map((s) => ({
    label: BUDGET_STATUS[s].label,
    value: count(s),
  }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardBody className="space-y-4">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-10 w-3/5" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          hero
          label="Valor aprovado"
          currency="R$"
          value={brl(approvedValue).replace("R$ ", "")}
          foot="Orçamentos aprovados"
        />
        <KpiCard
          label="Orçamentos"
          value={String(budgets.length)}
          foot="Total de propostas"
        />
        <KpiCard
          label="Pendentes"
          value={String(count("PENDENTE"))}
          foot="Aguardando decisão"
        />
        <KpiCard
          label="Aprovados"
          value={String(count("APROVADO"))}
          foot="Propostas fechadas"
        />
      </div>

      <Card>
        <CardBody>
          <span className="font-head text-[22px] font-bold text-text-1">
            Orçamentos por status
          </span>
          {budgets.length > 0 ? (
            <BarChart className="mt-2" data={byStatus} />
          ) : (
            <EmptyState
              icon={<FileText size={30} />}
              title="Nenhum orçamento"
              description="Crie orçamentos para ver a distribuição por status."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function BudgetList({
  budgets,
  loading,
  error,
  clientName,
  onReload,
  onUpdateStatus,
}: {
  budgets: Budget[];
  loading: boolean;
  error: boolean;
  clientName: (id: number) => string;
  onReload: () => void;
  onUpdateStatus: (b: Budget, status: BudgetStatus) => Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | BudgetStatus>("all");
  const [menuFor, setMenuFor] = useState<number | null>(null);

  const filtered =
    filter === "all" ? budgets : budgets.filter((b) => b.status === filter);

  return (
    <Card>
      <div className="flex flex-wrap gap-2.5 border-b border-border p-4">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Todos
        </FilterChip>
        {STATUS_LIST.map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
          >
            {BUDGET_STATUS[s].label}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<FileText size={30} />}
          title="Não foi possível carregar"
          description="Estamos passando por problemas técnicos, pedimos desculpas pelo incoveniente :("
          action={
            <Button variant="ghost" size="sm" onClick={onReload}>
              Tentar novamente
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={30} />}
          title="Nenhum orçamento"
          description="Os orçamentos criados aparecerão aqui."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Orçamento</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Status</th>
              <th className="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td className="font-mono text-[12.5px] font-semibold text-link-blue">
                  {b.code}
                </td>
                <td className="font-semibold">{clientName(b.clientId)}</td>
                <td className="text-text-2">
                  {b.items.length}{" "}
                  {b.items.length === 1 ? "item" : "itens"}
                </td>
                <td>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setMenuFor(menuFor === b.id ? null : b.id)
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-1.5 py-1 hover:border-border-strong hover:bg-surface-soft"
                    >
                      <Badge tone={BUDGET_STATUS[b.status].tone}>
                        {BUDGET_STATUS[b.status].label}
                      </Badge>
                      <ChevronDown size={13} className="text-text-3" />
                    </button>
                    {menuFor === b.id && (
                      <div className="fade-in absolute left-0 top-[34px] z-40 flex min-w-[186px] flex-col gap-0.5 rounded-xl border border-border bg-menu p-1.5 shadow-pop">
                        {STATUS_LIST.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={async () => {
                              setMenuFor(null);
                              if (s !== b.status) await onUpdateStatus(b, s);
                            }}
                            className="flex items-center gap-2 rounded-[10px] p-2 hover:bg-row-hover"
                          >
                            <Badge tone={BUDGET_STATUS[s].tone}>
                              {BUDGET_STATUS[s].label}
                            </Badge>
                            {b.status === s && (
                              <Check
                                size={14}
                                className="ml-auto text-link-blue"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="text-right font-mono font-semibold">
                  {brl(b.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

interface ItemRow {
  serviceId: number;
  quantity: number;
  unitPrice: number;
}

function BudgetForm({
  clients,
  services,
  onDone,
  onCancel,
}: {
  clients: Client[];
  services: Service[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(`ORC-${Date.now().toString().slice(-6)}`);
  const [clientId, setClientId] = useState<number | null>(null);
  const [status, setStatus] = useState<BudgetStatus>("PENDENTE");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceName = (id: number) =>
    services.find((s) => s.id === id)?.serviceName ?? `Serviço #${id}`;
  const total = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

  function addItem() {
    const first = services[0];
    if (!first) return;
    setItems((p) => [
      ...p,
      { serviceId: first.id, quantity: 1, unitPrice: first.price },
    ]);
  }

  async function submit() {
    if (!code.trim()) {
      setError("Informe o código do orçamento.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createBudget({
        code: code.trim(),
        status,
        clientId: clientId ?? undefined,
        totalPrice: total,
        items: items.map<CreateBudgetItemDTO>((i) => ({
          serviceId: i.serviceId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      onDone();
    } catch {
      setError("Não foi possível salvar o orçamento.");
      setSaving(false);
    }
  }

  return (
    <div className="fade-in grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={onCancel}
        >
          <ChevronLeft size={15} />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <FileText size={18} className="text-link-blue" />
            <CardTitle>Novo orçamento</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <Label required>Código</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono"
                />
              </Field>
              <Field>
                <Label>Cliente</Label>
                <Select
                  value={clientId ?? ""}
                  onChange={(e) =>
                    setClientId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">Selecione…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field>
              <Label>Status</Label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as BudgetStatus)}
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {BUDGET_STATUS[s].label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <Label>Serviços incluídos</Label>
              <div className="flex flex-col gap-2">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md border border-border p-2.5"
                  >
                    <Select
                      value={it.serviceId}
                      className="flex-1"
                      onChange={(e) => {
                        const s = services.find(
                          (x) => x.id === Number(e.target.value),
                        );
                        if (!s) return;
                        setItems((p) =>
                          p.map((x, idx) =>
                            idx === i
                              ? {
                                  serviceId: s.id,
                                  quantity: x.quantity,
                                  unitPrice: s.price,
                                }
                              : x,
                          ),
                        );
                      }}
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.serviceName}
                        </option>
                      ))}
                    </Select>
                    <Input
                      mono
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((x, idx) =>
                            idx === i
                              ? { ...x, quantity: Math.max(1, +e.target.value) }
                              : x,
                          ),
                        )
                      }
                      className="w-16 px-2 py-2"
                    />
                    <span className="w-24 text-right font-mono text-[13px] font-semibold">
                      {brl(it.quantity * it.unitPrice)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setItems((p) => p.filter((_, idx) => idx !== i))
                      }
                      className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <Button
                  variant="soft"
                  size="sm"
                  className="self-start"
                  onClick={addItem}
                  disabled={services.length === 0}
                >
                  <Plus size={15} />
                  Adicionar item
                </Button>
                {services.length === 0 && (
                  <span className="text-[12px] text-text-3">
                    Cadastre serviços para adicionar itens.
                  </span>
                )}
              </div>
            </Field>

            {error && (
              <div className="text-[12px] font-medium text-danger">{error}</div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="lg:sticky lg:top-[92px]">
        <Card className="overflow-hidden">
          <div className="bg-blue px-5 py-4 text-white">
            <div className="text-xs font-semibold text-[#A9C6E5]">
              VALOR DO ORÇAMENTO
            </div>
            <div className="mt-0.5 font-head text-[32px] font-bold">
              {brl(total)}
            </div>
          </div>
          <CardBody className="flex flex-col gap-2.5">
            <Button block onClick={submit} disabled={saving}>
              {saving ? <Spinner /> : <Check size={16} />}
              Emitir orçamento
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
