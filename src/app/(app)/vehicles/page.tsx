"use client";

import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Car,
  ScanLine,
  Info,
  Check,
  CheckCircle2,
  ChevronLeft,
  Upload,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { useAuth } from "@/components/auth/auth-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import {
  getVehicles,
  getClients,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  importNfeByPdf,
} from "@/lib/data";
import type { CreateVehicleDTO, Vehicle } from "@/types";
import { formatPlate } from "@/lib/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorText, FieldsetLabel, Divider } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PlateTag } from "@/components/ui/plate-tag";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { usePageActions } from "@/components/shell/topbar-actions";

type View = { kind: "list" } | { kind: "new" } | { kind: "edit"; vehicle: Vehicle };

const emptyForm: CreateVehicleDTO = {
  plate: "",
  brand: "",
  model: "",
  fabricationAndModel: "",
  color: "",
  renavam: "",
  chassis: "",
  clientId: null,
};

export default function VehiclesPage() {
  const { can } = useAuth();
  const { confirm } = useConfirm();
  const canWrite = can("VEHICLES_WRITE");
  const canImport = can("NFE_IMPORT");
  const vehicles = useResource(getVehicles, []);
  const clients = useResource(getClients, []);
  const [view, setView] = useState<View>({ kind: "list" });
  const [query, setQuery] = useState("");

  usePageActions(
    () =>
      canWrite ? (
        <Button onClick={() => setView({ kind: "new" })}>
          <Plus size={17} />
          Novo veículo
        </Button>
      ) : null,
    [canWrite],
  );

  async function remove(v: Vehicle) {
    const label = v.plate || v.model || `#${v.id}`;
    const ok = await confirm({
      title: "Excluir veículo",
      message: `Excluir o veículo "${label}"? Essa ação não pode ser desfeita.`,
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    await deleteVehicle(v.id);
    vehicles.reload();
  }

  const clientName = (id: number | null) =>
    id == null
      ? "—"
      : (clients.data?.find((c) => c.id === id)?.name ?? `#${id}`);

  const list = vehicles.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((v) =>
      [v.plate, v.brand, v.model, clientName(v.clientId)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, query, clients.data]);

  if (view.kind !== "list") {
    return (
      <VehicleForm
        vehicle={view.kind === "edit" ? view.vehicle : null}
        clients={clients.data ?? []}
        canImport={canImport}
        onDone={() => {
          vehicles.reload();
          setView({ kind: "list" });
        }}
        onCancel={() => setView({ kind: "list" })}
      />
    );
  }

  return (
    <Card className="fade-in">
      <div className="border-b border-border p-4">
        <SearchInput
          placeholder="Buscar por placa, modelo ou proprietário…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          wrapperClassName="w-full"
        />
      </div>

      {vehicles.loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : vehicles.error ? (
        <EmptyState
          icon={<Car size={30} />}
          title="Não foi possível carregar"
          description="Estamos passando por problemas técnicos, pedimos desculpas pelo incoveniente :("
          action={
            <Button variant="ghost" size="sm" onClick={vehicles.reload}>
              Tentar novamente
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Car size={30} />}
          title="Nenhum veículo"
          description="Cadastre o primeiro veículo para começar."
          action={
            canWrite ? (
              <Button size="sm" onClick={() => setView({ kind: "new" })}>
                <Plus size={15} />
                Novo veículo
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Marca / Modelo</th>
              <th>Ano</th>
              <th>Cor</th>
              <th>Proprietário</th>
              <th>RENAVAM</th>
              {canWrite && <th className="w-20" />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td>
                  {v.plate ? (
                    <PlateTag>{v.plate}</PlateTag>
                  ) : (
                    <Badge tone="warning">0 km</Badge>
                  )}
                </td>
                <td>
                  <div className="font-semibold">{v.brand}</div>
                  <div className="text-xs text-text-3">{v.model}</div>
                </td>
                <td className="font-mono text-[12.5px]">
                  {v.fabricationAndModel}
                </td>
                <td className="text-text-2">{v.color}</td>
                <td className="text-text-2">{clientName(v.clientId)}</td>
                <td className="font-mono text-[12.5px] text-text-2">
                  {v.renavam || "—"}
                </td>
                {canWrite && (
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => setView({ kind: "edit", vehicle: v })}
                        className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-surface-soft hover:text-text-1"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label="Excluir"
                        onClick={() => remove(v)}
                        className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function VehicleForm({
  vehicle,
  clients,
  canImport,
  onDone,
  onCancel,
}: {
  vehicle: Vehicle | null;
  clients: { id: number; name: string }[];
  canImport: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isEdit = vehicle != null;
  const [mode, setMode] = useState<"plate" | "zeroKm">("plate");
  const [form, setForm] = useState<CreateVehicleDTO>(
    vehicle
      ? {
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          fabricationAndModel: vehicle.fabricationAndModel,
          color: vehicle.color,
          renavam: vehicle.renavam,
          chassis: vehicle.chassis,
          clientId: vehicle.clientId,
        }
      : emptyForm,
  );
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const plateMode = mode === "plate";

  const set =
    (key: keyof CreateVehicleDTO) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const required = ["brand", "model", "fabricationAndModel", "color", "chassis"] as const;
  const missing = (k: (typeof required)[number]) =>
    touched && !(form[k] ?? "").toString().trim();

  function applyImport(vehicle: CreateVehicleDTO, warn: string[]) {
    setForm((f) => ({ ...f, ...vehicle }));
    setWarnings(warn);
    setImported(true);
  }

  async function importByFile(file: File) {
    setImporting(true);
    setError(null);
    try {
      const res = await importNfeByPdf(file);
      applyImport(res.vehicle, res.warnings ?? []);
    } catch {
      setError("Falha ao importar a NF-e pelo PDF do DANFE.");
    } finally {
      setImporting(false);
    }
  }

  async function submit() {
    setTouched(true);
    if (required.some((k) => !(form[k] ?? "").toString().trim())) return;
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      plate: plateMode ? form.plate?.trim() || undefined : undefined,
      renavam: form.renavam?.trim() || undefined,
      clientId: form.clientId ?? undefined,
    };
    try {
      if (vehicle) {
        await updateVehicle(vehicle.id, payload);
      } else {
        await createVehicle(payload);
      }
      onDone();
    } catch {
      setError("Não foi possível salvar o veículo.");
      setSaving(false);
    }
  }

  const okState = (value?: string | null) =>
    imported && value ? ("ok" as const) : ("default" as const);

  return (
    <div className="fade-in max-w-[880px]">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3.5"
        onClick={onCancel}
      >
        <ChevronLeft size={15} />
        Voltar à lista
      </Button>

      <Card>
        <CardHeader>
          <Car size={20} className="text-link-blue" />
          <CardTitle>{isEdit ? "Editar veículo" : "Cadastrar veículo"}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          {canImport && !isEdit && (
            <Field>
              <Label>Tipo de cadastro</Label>
              <div className="inline-flex gap-[5px] rounded-pill bg-track p-[5px]">
                <button
                  type="button"
                  onClick={() => setMode("plate")}
                  className={
                    "flex items-center gap-[7px] rounded-pill px-[18px] py-2.5 text-[13.5px] font-semibold transition-all " +
                    (plateMode
                      ? "bg-card text-text-1 shadow-raise [&_svg]:text-orange"
                      : "text-text-2 hover:text-text-1")
                  }
                >
                  <Car size={16} />
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setMode("zeroKm")}
                  className={
                    "flex items-center gap-[7px] rounded-pill px-[18px] py-2.5 text-[13.5px] font-semibold transition-all " +
                    (!plateMode
                      ? "bg-card text-text-1 shadow-raise [&_svg]:text-orange"
                      : "text-text-2 hover:text-text-1")
                  }
                >
                  <ScanLine size={16} />
                  Importar da NF-e
                </button>
              </div>
            </Field>
          )}

          {!plateMode && (
            <div className="rounded-lg border border-tint-info-border bg-tint-info p-[18px]">
              <div className="mb-1 flex items-center gap-2 text-link-blue">
                <Info size={16} />
                <span className="text-[13.5px] font-bold">
                  Importar dados da NF-e
                </span>
              </div>
              <p className="mb-3 text-[11.5px] text-text-3">
                Envie o PDF do DANFE da NF-e para preencher os dados do veículo
                automaticamente.
              </p>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-tint-info-border bg-card px-4 py-6 text-[13px] font-semibold text-link-blue transition-colors hover:bg-surface-soft disabled:opacity-60"
              >
                {importing ? <Spinner /> : <Upload size={18} />}
                {importing ? "Importando NF-e…" : "Enviar PDF do DANFE"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importByFile(file);
                  e.target.value = "";
                }}
              />

              {imported && !importing && (
                <div className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-success">
                  <CheckCircle2 size={15} />
                  Dados importados da NF-e — confira e complete abaixo.
                </div>
              )}
              {warnings.length > 0 && (
                <div className="mt-3 flex flex-col gap-1">
                  {warnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-[11.5px] font-medium text-warning"
                    >
                      <AlertTriangle size={13} />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <FieldsetLabel>Vínculo</FieldsetLabel>
            <Field>
              <Label>Proprietário</Label>
              <Select
                value={form.clientId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    clientId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              >
                <option value="">Selecione o cliente…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Divider />
            <FieldsetLabel>Dados do veículo</FieldsetLabel>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {plateMode ? (
                <Field>
                  <Label required>Placa</Label>
                  <Input
                    mono
                    className="uppercase"
                    value={form.plate ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        plate: formatPlate(e.target.value),
                      }))
                    }
                    placeholder="ABC1D23"
                  />
                </Field>
              ) : (
                <Field>
                  <Label required>Chassi (VIN)</Label>
                  <Input
                    mono
                    value={form.chassis}
                    onChange={set("chassis")}
                    state={missing("chassis") ? "error" : okState(form.chassis)}
                    placeholder="9BWZZZ..."
                  />
                  {missing("chassis") && <ErrorText>Campo obrigatório</ErrorText>}
                </Field>
              )}
              <Field>
                <Label required>Marca</Label>
                <Input
                  value={form.brand}
                  onChange={set("brand")}
                  state={missing("brand") ? "error" : okState(form.brand)}
                />
                {missing("brand") && <ErrorText>Campo obrigatório</ErrorText>}
              </Field>
              <Field>
                <Label required>Modelo</Label>
                <Input
                  value={form.model}
                  onChange={set("model")}
                  state={missing("model") ? "error" : okState(form.model)}
                />
                {missing("model") && <ErrorText>Campo obrigatório</ErrorText>}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <Label required>Ano fab./modelo</Label>
                <Input
                  mono
                  value={form.fabricationAndModel}
                  onChange={set("fabricationAndModel")}
                  state={
                    missing("fabricationAndModel")
                      ? "error"
                      : okState(form.fabricationAndModel)
                  }
                  placeholder="2024/2025"
                />
                {missing("fabricationAndModel") && (
                  <ErrorText>Campo obrigatório</ErrorText>
                )}
              </Field>
              <Field>
                <Label required>Cor</Label>
                <Input
                  value={form.color}
                  onChange={set("color")}
                  state={missing("color") ? "error" : okState(form.color)}
                />
                {missing("color") && <ErrorText>Campo obrigatório</ErrorText>}
              </Field>
              <Field>
                <Label>RENAVAM</Label>
                <Input
                  mono
                  value={form.renavam ?? ""}
                  onChange={set("renavam")}
                  placeholder={plateMode ? "00000000000" : "Após emplacamento"}
                  disabled={!plateMode && !form.renavam}
                />
              </Field>
            </div>

            {plateMode && (
              <Field>
                <Label required>Chassi (VIN)</Label>
                <Input
                  mono
                  value={form.chassis}
                  onChange={set("chassis")}
                  state={missing("chassis") ? "error" : okState(form.chassis)}
                  placeholder="9BWZZZ..."
                />
                {missing("chassis") && <ErrorText>Campo obrigatório</ErrorText>}
              </Field>
            )}
          </div>

          {error && <ErrorText>{error}</ErrorText>}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <Spinner /> : <Check size={16} />}
              {isEdit ? "Salvar alterações" : "Salvar veículo"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
