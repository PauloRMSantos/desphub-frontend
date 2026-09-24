"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Check,
  Trash2,
  FileText,
  Users,
  Car,
  Info,
  ChevronLeft,
  Printer,
  X,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import {
  getServiceOrders,
  getClients,
  getVehicles,
  getServices,
  getBudgets,
  createServiceOrder,
  updateServiceOrder,
} from "@/lib/data";
import type {
  AuthUser,
  Client,
  Vehicle,
  Service,
  Budget,
  ServiceOrder,
  OrderStatus,
  CreateServiceOrderItemDTO,
} from "@/types";
import { ORDER_STATUS, ORDER_FLOW } from "@/config/status";
import { brl, maskCpfCnpj, maskPhone } from "@/lib/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { usePageActions } from "@/components/shell/topbar-actions";
import { useAuth } from "@/components/auth/auth-provider";
import { PrintBrand } from "@/components/print/print-brand";

interface ItemRow {
  serviceId: number;
  quantity: number;
  unitPrice: number;
}

export default function OrdersPage() {
  const { user, can } = useAuth();
  const canWrite = can("SERVICE_ORDERS_WRITE");
  const orders = useResource(getServiceOrders, []);
  const clients = useResource(getClients, []);
  const vehicles = useResource(getVehicles, []);
  const services = useResource(getServices, []);
  const budgets = useResource(getBudgets, []);
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<ServiceOrder | null>(null);
  const [query, setQuery] = useState("");

  const authUserName = user?.name ?? "";
  usePageActions(
    () =>
      canWrite ? (
        <Button
          onClick={() => {
            setEditing(null);
            setView("form");
          }}
        >
          <Plus size={17} />
          Nova OS
        </Button>
      ) : null,
    [canWrite],
  );

  const clientName = (id: number) =>
    clients.data?.find((c) => c.id === id)?.name ?? `#${id}`;
  const vehiclePlate = (id: number) => {
    const v = vehicles.data?.find((x) => x.id === id);
    return v?.plate || v?.model || `#${id}`;
  };

  const list = orders.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) =>
      [o.code, clientName(o.clientId)].join(" ").toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, query, clients.data]);

  if (view === "form") {
    return (
      <OrderForm
        order={editing}
        clients={clients.data ?? []}
        vehicles={vehicles.data ?? []}
        services={services.data ?? []}
        budgets={budgets.data ?? []}
        authUserName={authUserName}
        onDone={() => {
          orders.reload();
          setView("list");
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  return (
    <Card className="fade-in">
      <div className="border-b border-border p-4">
        <SearchInput
          placeholder="Buscar por código ou cliente…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          wrapperClassName="w-full"
        />
      </div>

      {orders.loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : orders.error ? (
        <EmptyState
          icon={<FileText size={30} />}
          title="Não foi possível carregar"
          description="Estamos passando por problemas técnicos, pedimos desculpas pelo incoveniente :("
          action={
            <Button variant="ghost" size="sm" onClick={orders.reload}>
              Tentar novamente
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={30} />}
          title="Nenhuma ordem de serviço"
          description="Crie a primeira OS para começar."
          action={
            canWrite ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setView("form");
                }}
              >
                <Plus size={15} />
                Nova OS
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Veículo</th>
              <th>Status</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o.id}
                className="cursor-pointer"
                onClick={() => {
                  setEditing(o);
                  setView("form");
                }}
              >
                <td className="font-mono text-[12.5px] font-semibold text-link-blue">
                  {o.code}
                </td>
                <td className="font-semibold">{clientName(o.clientId)}</td>
                <td className="text-text-2">{vehiclePlate(o.vehicleId)}</td>
                <td>
                  <Badge tone={ORDER_STATUS[o.orderStatus].tone}>
                    {ORDER_STATUS[o.orderStatus].label}
                  </Badge>
                </td>
                <td className="text-right font-mono font-semibold">
                  {brl(o.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function OrderForm({
  order,
  clients,
  vehicles,
  services,
  budgets,
  onDone,
  authUserName,
  onCancel,
}: {
  order: ServiceOrder | null;
  clients: Client[];
  vehicles: Vehicle[];
  services: Service[];
  budgets: Budget[];
  authUserName: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(
    order?.code ?? `OS-${Date.now().toString().slice(-6)}`,
  );
  const [status, setStatus] = useState<OrderStatus>(
    order?.orderStatus ?? "ABERTA",
  );
  const [clientId, setClientId] = useState<number | null>(
    order?.clientId ?? null,
  );
  const [vehicleId, setVehicleId] = useState<number | null>(
    order?.vehicleId ?? null,
  );
  const [originBudgetId, setOriginBudgetId] = useState<number | null>(
    order?.originBudgetId ?? null,
  );
  const [feesTotal, setFeesTotal] = useState<number>(order?.feesTotal ?? 0);
  const [items, setItems] = useState<ItemRow[]>(
    order?.items.map((i) => ({
      serviceId: i.serviceId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })) ?? [],
  );
  const [addOpen, setAddOpen] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientVehicles = vehicles.filter((v) => v.clientId === clientId);
  const serviceName = (id: number) =>
    services.find((s) => s.id === id)?.serviceName ?? `Serviço #${id}`;

  const servicesTotal = items.reduce(
    (acc, i) => acc + i.quantity * i.unitPrice,
    0,
  );
  const total = servicesTotal + (Number(feesTotal) || 0);

  function importBudget(id: number | null) {
    setOriginBudgetId(id);
    if (id == null) return;
    const b = budgets.find((x) => x.id === id);
    if (!b) return;
    setClientId(b.clientId);
    setItems(
      b.items.map((it) => ({
        serviceId: it.serviceId,
        quantity: it.quantity ?? 1,
        unitPrice: it.unitPrice,
      })),
    );
  }

  function addService(s: Service) {
    setItems((p) => [
      ...p,
      { serviceId: s.id, quantity: 1, unitPrice: s.price },
    ]);
    setAddOpen(false);
  }

  async function submit() {
    if (!clientId || !vehicleId || !code.trim()) {
      setError("Preencha código, cliente e veículo.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      code: code.trim(),
      orderStatus: status,
      clientId,
      vehicleId,
      originBudgetId: originBudgetId ?? null,
      servicesTotal,
      feesTotal: Number(feesTotal) || 0,
      total,
      items: items.map<CreateServiceOrderItemDTO>((i) => ({
        serviceId: i.serviceId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };
    try {
      if (order) await updateServiceOrder(order.id, payload);
      else await createServiceOrder(payload);
      onDone();
    } catch {
      setError("Não foi possível salvar a ordem de serviço.");
      setSaving(false);
    }
  }

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) ?? null;

  return (
    <div className="fade-in grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={onCancel}
        >
          <ChevronLeft size={15} />
          Voltar à lista
        </Button>

        <Card className="border-l-[3px] border-l-link-blue">
          <CardBody className="flex flex-wrap items-center gap-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-info-bg text-link-blue">
              <FileText size={19} />
            </span>
            <div className="min-w-[180px] flex-1">
              <div className="text-[13.5px] font-bold">
                Partir de um orçamento
              </div>
              <div className="text-xs text-text-3">
                Importa cliente e serviços de uma proposta existente
              </div>
            </div>
            <Select
              className="max-w-[320px]"
              value={originBudgetId ?? ""}
              onChange={(e) =>
                importBudget(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Selecionar orçamento…</option>
              {budgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} · {brl(b.totalPrice)}
                </option>
              ))}
            </Select>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-3">
                  {order ? "Editar ordem" : "Nova ordem de serviço"}
                </span>
                <div className="mt-1">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="max-w-[220px] font-mono font-bold"
                  />
                </div>
              </div>
              <Badge tone={ORDER_STATUS[status].tone}>
                {ORDER_STATUS[status].label}
              </Badge>
            </div>
            <StatusStepper status={status} onPick={setStatus} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Users size={18} className="text-link-blue" />
            <CardTitle>Cliente e veículo</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <Label required>Cliente</Label>
              <Select
                value={clientId ?? ""}
                onChange={(e) => {
                  setClientId(e.target.value ? Number(e.target.value) : null);
                  setVehicleId(null);
                }}
              >
                <option value="">Selecione…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label required>Veículo</Label>
              <Select
                value={vehicleId ?? ""}
                onChange={(e) =>
                  setVehicleId(e.target.value ? Number(e.target.value) : null)
                }
                disabled={!clientId}
              >
                <option value="">
                  {clientId
                    ? clientVehicles.length
                      ? "Selecione…"
                      : "Cliente sem veículo vinculado"
                    : "Selecione o cliente primeiro"}
                </option>
                {clientVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {(v.plate || "0 km") + " — " + v.brand + " " + v.model}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <FileText size={18} className="text-link-blue" />
            <CardTitle>Serviços</CardTitle>
            <span className="ml-auto">
              <div className="relative">
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => setAddOpen((o) => !o)}
                >
                  <Plus size={15} />
                  Adicionar serviço
                </Button>
                {addOpen && (
                  <div className="fade-in absolute right-0 top-[38px] z-30 max-h-[280px] w-[300px] overflow-y-auto rounded-lg border border-border bg-menu p-1.5 shadow-pop">
                    {services.length === 0 ? (
                      <div className="px-2.5 py-2 text-[13px] text-text-3">
                        Nenhum serviço cadastrado.
                      </div>
                    ) : (
                      services.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => addService(s)}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left hover:bg-row-hover"
                        >
                          <span className="flex-1 text-[13px]">
                            {s.serviceName}
                          </span>
                          <span className="font-mono text-xs text-text-3">
                            {brl(s.price)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </span>
          </CardHeader>
          <Table>
            <thead>
              <tr>
                <th>Serviço</th>
                <th className="w-20">Qtd</th>
                <th className="w-[130px]">Valor unit.</th>
                <th className="w-[120px] text-right">Subtotal</th>
                <th className="w-11" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-text-3">
                    Nenhum serviço adicionado.
                  </td>
                </tr>
              ) : (
                items.map((it, i) => (
                  <tr key={i}>
                    <td className="font-semibold">{serviceName(it.serviceId)}</td>
                    <td>
                      <Input
                        mono
                        type="number"
                        min={1}
                        value={it.quantity}
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
                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          setItems((p) => p.filter((_, idx) => idx !== i))
                        }
                        className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </div>

      <div className="lg:sticky lg:top-[92px]">
        <Card className="overflow-hidden">
          <div className="bg-deep px-5 py-4 text-white">
            <div className="text-xs font-semibold tracking-[0.5px] text-[#9DB4CE]">
              TOTAL DA OS
            </div>
            <div className="mt-0.5 font-head text-[34px] font-bold leading-tight">
              {brl(total)}
            </div>
          </div>
          <CardBody className="text-[13.5px]">
            <TotalRow label={`Serviços (${items.length})`} value={brl(servicesTotal)} />
            <div className="flex items-center justify-between py-1.5">
              <span className="text-text-2">Taxas</span>
              <Input
                mono
                type="number"
                value={feesTotal}
                onChange={(e) => setFeesTotal(+e.target.value)}
                className="w-28 px-2 py-1 text-right"
              />
            </div>
            <div className="my-2.5 h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="font-bold">Total</span>
              <span className="font-mono text-base font-bold">{brl(total)}</span>
            </div>

            {error && (
              <div className="mt-3 text-[12px] font-medium text-danger">
                {error}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2.5">
              <Button block onClick={submit} disabled={saving}>
                {saving ? <Spinner /> : <Check size={16} />}
                {order ? "Salvar alterações" : "Salvar ordem"}
              </Button>
              <Button
                variant="ghost"
                block
                onClick={() => setShowPrint(true)}
                disabled={!clientId || !vehicleId}
              >
                <Printer size={16} />
                Imprimir OS
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardBody className="text-[12.5px]">
            <div className="mb-2 flex items-center gap-2 font-bold text-link-blue">
              <Car size={16} />
              Veículo selecionado
            </div>
            {selectedVehicle ? (
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[15px] font-semibold">
                  {selectedVehicle.plate || "0 km"}
                </span>
                <span className="text-text-3">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </span>
              </div>
            ) : (
              <span className="text-text-3">Nenhum veículo selecionado</span>
            )}
          </CardBody>
        </Card>
      </div>

      {showPrint && (
        <PrintSheet
          code={code}
          client={selectedClient}
          vehicle={selectedVehicle}
          items={items}
          serviceName={serviceName}
          servicesTotal={servicesTotal}
          feesTotal={Number(feesTotal) || 0}
          total={total}
          onClose={() => setShowPrint(false)}
          authUserName={authUserName}
        />
      )}
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-text-2">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function StatusStepper({
  status,
  onPick,
}: {
  status: OrderStatus;
  onPick: (s: OrderStatus) => void;
}) {
  const current = ORDER_FLOW.indexOf(status);
  return (
    <div className="flex items-center">
      {ORDER_FLOW.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => onPick(s)}
              className="flex flex-col items-center gap-[7px]"
            >
              <span
                className="grid h-[30px] w-[30px] place-items-center rounded-full border-2 font-mono text-[13px] font-bold transition-all"
                style={{
                  borderColor: active
                    ? "var(--orange)"
                    : done
                      ? "var(--success)"
                      : "var(--border-strong)",
                  background: active
                    ? "var(--orange)"
                    : done
                      ? "var(--success)"
                      : "var(--card-bg)",
                  color: active || done ? "#fff" : "var(--text-3)",
                }}
              >
                {done ? <Check size={15} /> : i + 1}
              </span>
              <span
                className="whitespace-nowrap text-[11.5px]"
                style={{
                  fontWeight: active ? 700 : 500,
                  color: active
                    ? "var(--orange)"
                    : done
                      ? "var(--badge-success-fg)"
                      : "var(--text-3)",
                }}
              >
                {ORDER_STATUS[s].label}
              </span>
            </button>
            {i < ORDER_FLOW.length - 1 && (
              <span
                className="mx-1.5 mb-[22px] h-0.5 flex-1 rounded"
                style={{
                  background:
                    i < current ? "var(--success)" : "var(--border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PrintSheet({
  code,
  client,
  vehicle,
  items,
  serviceName,
  servicesTotal,
  feesTotal,
  total,
  onClose,
  authUserName,
}: {
  code: string;
  client: Client | null;
  vehicle: Vehicle | null;
  items: ItemRow[];
  serviceName: (id: number) => string;
  servicesTotal: number;
  feesTotal: number;
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
                <div className="font-head text-xl font-bold">
                  ORDEM DE SERVIÇO
                </div>
                <div className="font-mono text-[13px] font-semibold text-[#003F7D]">
                  {code}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-6">
              <PrintBlock
                title="Cliente"
                rows={[
                  ["Nome", client?.name ?? "—"],
                  ["CPF/CNPJ", client?.cpfCnpj ? maskCpfCnpj(client.cpfCnpj) : "—"],
                  ["Telefone", client?.telephone ? maskPhone(client.telephone) : "—"],
                  ["Endereço", client?.address || "—"],
                ]}
              />
              <PrintBlock
                title="Veículo"
                rows={
                  vehicle
                    ? [
                        ["Placa", vehicle.plate || "0 km"],
                        ["Marca/Modelo", `${vehicle.brand} ${vehicle.model}`],
                        ["Ano", vehicle.fabricationAndModel],
                        ["RENAVAM", vehicle.renavam || "—"],
                      ]
                    : [["—", "Sem veículo"]]
                }
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
                <div className="flex justify-between py-0.5">
                  <span className="text-[#5A6472]">Subtotal serviços</span>
                  <span className="font-mono">{brl(servicesTotal)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-[#5A6472]">Taxas</span>
                  <span className="font-mono">{brl(feesTotal)}</span>
                </div>
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

function PrintBlock({ title, rows }: { title: string; rows: [string, string][] }) {
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
