"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  FileText,
  Check,
  Trash2,
  ChevronDown,
  ChevronLeft,
  Printer,
  X,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import {
  getBudgets,
  getClients,
  getServices,
  createBudget,
  updateBudget,
  errorDetail,
} from "@/lib/data";
import type {
  Budget,
  BudgetStatus,
  Client,
  Service,
  CreateBudgetItemDTO,
} from "@/types";
import { BUDGET_STATUS } from "@/config/status";
import { brl, maskPhone } from "@/lib/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { usePageActions } from "@/components/shell/topbar-actions";
import { AddServiceMenu } from "@/components/services/add-service-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { PrintBrand } from "@/components/print/print-brand";

const STATUS_LIST: BudgetStatus[] = ["PENDENTE", "APROVADO", "RECUSADO"];

interface ItemRow {
  serviceId: number;
  quantity: number;
  unitPrice: number;
}

export default function BudgetsPage() {
  const { can, user } = useAuth();
  const toast = useToast();
  const canWrite = can("BUDGETS_WRITE");
  const budgets = useResource(getBudgets, []);
  const clients = useResource(getClients, []);
  const services = useResource(getServices, []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  usePageActions(
    () =>
      canWrite ? (
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={17} />
          Novo orçamento
        </Button>
      ) : null,
    [canWrite],
  );

  const clientName = (id: number | null | undefined) => {
    if (id == null) return "-";
    return clients.data?.find((c) => c.id === id)?.name ?? `#${id}`;
  };

  const list = budgets.data ?? [];

  if (formOpen) {
    return (
      <BudgetForm
        budget={editing}
        canWrite={canWrite}
        clients={clients.data ?? []}
        services={services.data ?? []}
        authUserName={user?.name ?? ""}
        onDone={() => {
          budgets.reload();
          setFormOpen(false);
        }}
        onCancel={() => setFormOpen(false)}
      />
    );
  }

  return (
    <BudgetList
      budgets={list}
      loading={budgets.loading}
      error={!!budgets.error}
      canWrite={canWrite}
      clientName={clientName}
      onReload={budgets.reload}
      onOpen={(b) => {
        setEditing(b);
        setFormOpen(true);
      }}
      onUpdateStatus={async (b, status) => {
        try {
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
          toast.success("Status atualizado", `${b.code} · ${BUDGET_STATUS[status].label}`);
        } catch (err) {
          toast.error("Não foi possível atualizar o status", errorDetail(err));
        }
      }}
    />
  );
}

function BudgetList({
  budgets,
  loading,
  error,
  canWrite,
  clientName,
  onReload,
  onOpen,
  onUpdateStatus,
}: {
  budgets: Budget[];
  loading: boolean;
  error: boolean;
  canWrite: boolean;
  clientName: (id: number | null | undefined) => string;
  onReload: () => void;
  onOpen: (b: Budget) => void;
  onUpdateStatus: (b: Budget, status: BudgetStatus) => Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | BudgetStatus>("all");

  const filtered =
    filter === "all" ? budgets : budgets.filter((b) => b.status === filter);

  return (
    <Card className="fade-in">
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
              <tr
                key={b.id}
                className="cursor-pointer"
                onClick={() => onOpen(b)}
              >
                <td className="font-mono text-[12.5px] font-semibold text-link-blue">
                  {b.code}
                </td>
                <td className="font-semibold">{clientName(b.clientId)}</td>
                <td className="text-text-2">
                  {b.items.length} {b.items.length === 1 ? "item" : "itens"}
                </td>
                <td>
                  {!canWrite ? (
                    <Badge tone={BUDGET_STATUS[b.status].tone}>
                      {BUDGET_STATUS[b.status].label}
                    </Badge>
                  ) : (
                    <StatusMenu
                      status={b.status}
                      onPick={(s) => {
                        if (s !== b.status) onUpdateStatus(b, s);
                      }}
                    />
                  )}
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

function StatusMenu({
  status,
  onPick,
}: {
  status: BudgetStatus;
  onPick: (s: BudgetStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: r.left });
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-1.5 py-1 hover:border-border-strong hover:bg-surface-soft"
      >
        <Badge tone={BUDGET_STATUS[status].tone}>
          {BUDGET_STATUS[status].label}
        </Badge>
        <ChevronDown size={13} className="text-text-3" />
      </button>
      {open &&
        mounted &&
        pos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[55]"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            />
            <div
              style={{ position: "fixed", top: pos.top, left: pos.left }}
              className="fade-in z-[56] flex min-w-[186px] flex-col gap-0.5 rounded-xl border border-border bg-menu p-1.5 shadow-pop"
            >
              {STATUS_LIST.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onPick(s);
                  }}
                  className="flex items-center gap-2 rounded-[10px] p-2 hover:bg-row-hover"
                >
                  <Badge tone={BUDGET_STATUS[s].tone}>
                    {BUDGET_STATUS[s].label}
                  </Badge>
                  {status === s && (
                    <Check size={14} className="ml-auto text-link-blue" />
                  )}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function BudgetForm({
  budget,
  canWrite,
  clients,
  services,
  authUserName,
  onDone,
  onCancel,
}: {
  budget: Budget | null;
  canWrite: boolean;
  clients: Client[];
  services: Service[];
  authUserName: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(
    budget?.code ?? `ORC-${Date.now().toString().slice(-6)}`,
  );
  const [clientId, setClientId] = useState<number | null>(
    budget?.clientId ?? null,
  );
  const [status, setStatus] = useState<BudgetStatus>(
    budget?.status ?? "PENDENTE",
  );
  const [items, setItems] = useState<ItemRow[]>(
    budget?.items.map((i) => ({
      serviceId: i.serviceId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })) ?? [],
  );
  const [showPrint, setShowPrint] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const serviceName = (id: number) =>
    services.find((s) => s.id === id)?.serviceName ?? `Serviço #${id}`;
  const total = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const selectedClient = clients.find((c) => c.id === clientId) ?? null;

  function addService(s: Service) {
    setItems((p) => [
      ...p,
      { serviceId: s.id, quantity: 1, unitPrice: s.price },
    ]);
  }

  async function submit() {
    if (!code.trim()) {
      toast.error("Campo obrigatório faltando", "código do orçamento");
      return;
    }
    setSaving(true);
    const payload = {
      code: code.trim(),
      status,
      clientId: clientId ?? undefined,
      totalPrice: total,
      items: items.map<CreateBudgetItemDTO>((i) => ({
        serviceId: i.serviceId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };
    try {
      if (budget) await updateBudget(budget.id, payload);
      else await createBudget(payload);
      toast.success(
        budget ? "Orçamento atualizado" : "Orçamento emitido",
        payload.code,
      );
      onDone();
    } catch (err) {
      toast.error("Não foi possível salvar o orçamento", errorDetail(err));
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
            <CardTitle>
              {budget ? "Editar orçamento" : "Novo orçamento"}
            </CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <Label required>Código</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono"
                  disabled={!canWrite}
                />
              </Field>
              <Field>
                <Label>Cliente</Label>
                <Select
                  value={clientId ?? ""}
                  disabled={!canWrite}
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
                searchable={false}
                value={status}
                disabled={!canWrite}
                onChange={(e) => setStatus(e.target.value as BudgetStatus)}
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {BUDGET_STATUS[s].label}
                  </option>
                ))}
              </Select>
            </Field>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Serviços incluídos</Label>
                {canWrite && (
                  <AddServiceMenu services={services} onPick={addService} />
                )}
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <thead>
                    <tr>
                      <th>Serviço</th>
                      <th className="w-20">Qtd</th>
                      <th className="w-[130px]">Valor unit.</th>
                      <th className="w-[120px] text-right">Subtotal</th>
                      {canWrite && <th className="w-11" />}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canWrite ? 5 : 4}
                          className="py-6 text-center text-text-3"
                        >
                          Nenhum serviço adicionado.
                        </td>
                      </tr>
                    ) : (
                      items.map((it, i) => (
                        <tr key={i}>
                          <td className="font-semibold">
                            {serviceName(it.serviceId)}
                          </td>
                          <td>
                            <Input
                              mono
                              type="number"
                              min={1}
                              value={it.quantity}
                              disabled={!canWrite}
                              onChange={(e) =>
                                setItems((p) =>
                                  p.map((x, idx) =>
                                    idx === i
                                      ? {
                                          ...x,
                                          quantity: Math.max(1, +e.target.value),
                                        }
                                      : x,
                                  ),
                                )
                              }
                              className="w-16 px-2 py-1.5 text-center"
                            />
                          </td>
                          <td>
                            <Input
                              mono
                              type="number"
                              value={it.unitPrice}
                              disabled={!canWrite}
                              onChange={(e) =>
                                setItems((p) =>
                                  p.map((x, idx) =>
                                    idx === i
                                      ? { ...x, unitPrice: +e.target.value }
                                      : x,
                                  ),
                                )
                              }
                              className="w-24 px-2 py-1.5"
                            />
                          </td>
                          <td className="text-right font-mono font-semibold">
                            {brl(it.quantity * it.unitPrice)}
                          </td>
                          {canWrite && (
                            <td>
                              <button
                                type="button"
                                onClick={() =>
                                  setItems((p) =>
                                    p.filter((_, idx) => idx !== i),
                                  )
                                }
                                className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
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
            {canWrite && (
              <Button block onClick={submit} disabled={saving}>
                {saving ? <Spinner /> : <Check size={16} />}
                {budget ? "Salvar alterações" : "Emitir orçamento"}
              </Button>
            )}
            <Button variant="ghost" block onClick={() => setShowPrint(true)}>
              <Printer size={16} />
              Imprimir orçamento
            </Button>
          </CardBody>
        </Card>
      </div>

      {showPrint && (
        <BudgetPrintSheet
          code={code}
          status={status}
          client={selectedClient}
          items={items}
          serviceName={serviceName}
          total={total}
          authUserName={authUserName}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}

function BudgetPrintSheet({
  code,
  status,
  client,
  items,
  serviceName,
  total,
  authUserName,
  onClose,
}: {
  code: string;
  status: BudgetStatus;
  client: Client | null;
  items: ItemRow[];
  serviceName: (id: number) => string;
  total: number;
  authUserName?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-card bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-surface-soft px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold">
            <Printer size={17} />
            Pré-visualização de impressão
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => window.print()}>
              <Printer size={15} />
              Imprimir
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={15} />
            </Button>
          </div>
        </div>
        <div className="overflow-y-auto bg-[#9AA5B1] p-6">
          <div
            id="print-area"
            className="mx-auto max-w-[720px] bg-white p-10 text-[#111827]"
          >
            <div className="flex items-center justify-between border-b-[3px] border-[#0B1929] pb-4">
              <PrintBrand />
              <div className="text-right">
                <div className="font-head text-xl font-bold">ORÇAMENTO</div>
                <div className="font-mono text-[13px] font-semibold text-[#003F7D]">
                  {code}
                </div>
                <div className="mt-0.5 text-[11px] text-[#5A6472]">
                  {BUDGET_STATUS[status].label}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <PrintBlock
                title="Cliente"
                rows={[
                  ["Nome", client?.name ?? "—"],
                  [
                    "Telefone",
                    client?.telephone ? maskPhone(client.telephone) : "—",
                  ],
                ]}
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 border-b border-[#E5E7EB] pb-1 font-head text-sm font-bold uppercase tracking-[1px] text-[#003F7D]">
                Serviços
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[#5A6472]">
                    <th className="py-1">Descrição</th>
                    <th className="w-16 py-1 text-center">Qtd</th>
                    <th className="w-28 py-1 text-right">Valor unit.</th>
                    <th className="w-28 py-1 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-t border-[#EEF0F3]">
                      <td className="py-1.5">{serviceName(it.serviceId)}</td>
                      <td className="py-1.5 text-center font-mono">
                        {it.quantity}
                      </td>
                      <td className="py-1.5 text-right font-mono">
                        {brl(it.unitPrice)}
                      </td>
                      <td className="py-1.5 text-right font-mono">
                        {brl(it.quantity * it.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3.5 flex justify-end">
              <div className="w-64 text-[13px]">
                <div className="mt-1.5 flex justify-between border-t-2 border-[#0B1929] pt-2 text-base font-bold">
                  <span>TOTAL</span>
                  <span className="font-mono">{brl(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-16">
              <div className="border-t border-[#111827] pt-1.5 text-center text-[11.5px] text-[#5A6472]">
                {client?.name || "Cliente"}
              </div>
              <div className="border-t border-[#111827] pt-1.5 text-center text-[11.5px] text-[#5A6472]">
                {authUserName || "Despachante"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintBlock({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div>
      <div className="mb-2 border-b border-[#E5E7EB] pb-1 font-head text-sm font-bold uppercase tracking-[1px] text-[#003F7D]">
        {title}
      </div>
      {rows.map(([label, value], i) => (
        <div key={i} className="mb-1 flex gap-2 text-[12.5px]">
          <span className="min-w-[92px] text-[#636B78]">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}
