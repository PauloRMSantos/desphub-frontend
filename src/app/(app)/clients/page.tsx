"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  Phone,
  FileText,
  MapPin,
  Car,
  Users,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { useAuth } from "@/components/auth/auth-provider";
import {
  getClients,
  getVehicles,
  createClient,
  updateClient,
  deleteClient,
} from "@/lib/data";
import type { Client, CreateClientDTO } from "@/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorText } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Avatar, initials } from "@/components/ui/avatar";
import { PlateTag } from "@/components/ui/plate-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { usePageActions } from "@/components/shell/topbar-actions";

type Mode = "view" | "edit" | "new";

export default function ClientsPage() {
  const { can } = useAuth();
  const canWrite = can("CLIENTS_WRITE");
  const clients = useResource(getClients, []);
  const vehicles = useResource(getVehicles, []);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("view");

  usePageActions(
    () =>
      canWrite ? (
        <Button
          onClick={() => {
            setSelectedId(null);
            setMode("new");
          }}
        >
          <Plus size={17} />
          Novo cliente
        </Button>
      ) : null,
    [canWrite],
  );

  const list = clients.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.cpfCnpj ?? "").toLowerCase().includes(q),
    );
  }, [list, query]);

  const selected = list.find((c) => c.id === selectedId) ?? null;
  const linkedVehicles = (vehicles.data ?? []).filter(
    (v) => selected && v.clientId === selected.id,
  );

  async function handleCreate(data: CreateClientDTO) {
    await createClient(data);
    await clients.reload();
    setMode("view");
  }

  async function handleUpdate(data: CreateClientDTO) {
    if (!selected) return;
    await updateClient(selected.id, data);
    await clients.reload();
    setMode("view");
  }

  async function handleDelete() {
    if (!selected) return;
    if (!window.confirm(`Excluir o cliente "${selected.name}"?`)) return;
    await deleteClient(selected.id);
    setSelectedId(null);
    setMode("view");
    clients.reload();
  }

  const showForm = mode === "edit" || mode === "new";

  return (
    <div className="fade-in grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.5fr_0.95fr]">
      <Card>
        <div className="border-b border-border p-4">
          <SearchInput
            placeholder="Buscar por nome ou CPF/CNPJ…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            wrapperClassName="w-full"
          />
          <div className="mt-3 text-[12.5px] text-text-3">
            {filtered.length}{" "}
            {filtered.length === 1 ? "cliente" : "clientes"}
          </div>
        </div>

        {clients.loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : clients.error ? (
          <EmptyState
            icon={<Users size={30} />}
            title="Não foi possível carregar"
            description="Estamos passando por problemas técnicos, pedimos desculpas pelo incoveniente :("
            action={
              <Button variant="ghost" size="sm" onClick={clients.reload}>
                Tentar novamente
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={30} />}
            title="Nenhum cliente"
            description="Cadastre o primeiro cliente para começar."
          />
        ) : (
          <div className="max-h-[560px] overflow-y-auto">
            <Table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>CPF / CNPJ</th>
                  <th>Telefone</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => {
                      setSelectedId(c.id);
                      setMode("view");
                    }}
                    className={
                      "cursor-pointer " +
                      (c.id === selectedId && mode !== "new"
                        ? "!bg-blue-50 shadow-[inset_3px_0_0_var(--orange)]"
                        : "")
                    }
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-[34px] w-[34px] rounded-lg text-xs">
                          {initials(c.name)}
                        </Avatar>
                        <span className="font-semibold leading-tight">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="font-mono text-[12.5px] text-text-2">
                      {c.cpfCnpj || "—"}
                    </td>
                    <td className="whitespace-nowrap text-text-2">
                      {c.telephone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {showForm ? (
        <Card className="xl:sticky xl:top-[92px]">
          <CardHeader>
            <CardTitle>
              {mode === "new" ? "Novo cliente" : "Editar cliente"}
            </CardTitle>
          </CardHeader>
          <ClientForm
            key={mode === "new" ? "new" : selected?.id}
            client={mode === "edit" ? selected : null}
            onCancel={() => setMode("view")}
            onSubmit={mode === "new" ? handleCreate : handleUpdate}
          />
        </Card>
      ) : selected ? (
        <Card className="xl:sticky xl:top-[92px]">
          <CardHeader>
            <CardTitle>Ficha do cliente</CardTitle>
            {canWrite && (
              <span className="ml-auto flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode("edit")}
                >
                  <Pencil size={15} />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-danger hover:bg-danger-bg"
                >
                  <Trash2 size={15} />
                </Button>
              </span>
            )}
          </CardHeader>
          <CardBody>
            <div className="mb-2 flex items-center gap-4">
              <Avatar className="h-14 w-14 rounded-xl text-lg">
                {initials(selected.name)}
              </Avatar>
              <div className="font-head text-[21px] font-bold leading-none text-text-1">
                {selected.name}
              </div>
            </div>

            <InfoRow icon={<FileText size={17} />} label="CPF / CNPJ">
              {selected.cpfCnpj ? (
                <span className="font-mono">{selected.cpfCnpj}</span>
              ) : (
                <span className="text-text-3">Não informado</span>
              )}
            </InfoRow>
            <InfoRow icon={<Phone size={17} />} label="Telefone">
              {selected.telephone}
            </InfoRow>
            <InfoRow icon={<MapPin size={17} />} label="Endereço">
              {selected.address || (
                <span className="text-text-3">Não informado</span>
              )}
            </InfoRow>

            <div className="mt-5">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 font-head text-[15px] font-bold uppercase tracking-[0.8px] text-text-1 [&_svg]:text-orange">
                  <Car size={16} />
                  Veículos vinculados
                </span>
                <span className="rounded-badge bg-neutral-bg px-2.5 py-1 text-xs font-semibold text-badge-neutral-fg">
                  {linkedVehicles.length}
                </span>
              </div>
              {linkedVehicles.length === 0 ? (
                <p className="text-[13px] text-text-3">
                  Nenhum veículo vinculado.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {linkedVehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-info-bg text-link-blue">
                        <Car size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold text-text-1">
                          {v.brand} {v.model}
                        </div>
                        <div className="text-[11.5px] text-text-3">
                          {v.fabricationAndModel} · {v.color}
                        </div>
                      </div>
                      {v.plate && <PlateTag>{v.plate}</PlateTag>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="xl:sticky xl:top-[92px]">
          <EmptyState
            icon={<Users size={30} />}
            title="Selecione um cliente"
            description="Escolha um cliente na lista para ver a ficha, ou cadastre um novo."
          />
        </Card>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-surface-soft text-text-2">
        {icon}
      </span>
      <div>
        <div className="text-[11.5px] font-semibold text-text-3">{label}</div>
        <div className="text-sm font-medium text-text-1">{children}</div>
      </div>
    </div>
  );
}

function ClientForm({
  client,
  onCancel,
  onSubmit,
}: {
  client: Client | null;
  onCancel: () => void;
  onSubmit: (data: CreateClientDTO) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateClientDTO>({
    name: client?.name ?? "",
    telephone: client?.telephone ?? "",
    cpfCnpj: client?.cpfCnpj ?? "",
    address: client?.address ?? "",
  });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errName = touched && !form.name.trim();
  const errPhone = touched && !form.telephone.trim();

  const set =
    (key: keyof CreateClientDTO) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit() {
    setTouched(true);
    if (!form.name.trim() || !form.telephone.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        telephone: form.telephone.trim(),
        cpfCnpj: form.cpfCnpj?.trim() || undefined,
        address: form.address?.trim() || undefined,
      });
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CardBody className="flex flex-col gap-4">
      <Field>
        <Label required>Nome</Label>
        <Input
          value={form.name}
          onChange={set("name")}
          placeholder="Nome completo ou razão social"
          state={errName ? "error" : "default"}
        />
        {errName && <ErrorText>Campo obrigatório</ErrorText>}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <Label required>Telefone</Label>
          <Input
            value={form.telephone}
            onChange={set("telephone")}
            placeholder="(00) 00000-0000"
            state={errPhone ? "error" : "default"}
          />
          {errPhone && <ErrorText>Campo obrigatório</ErrorText>}
        </Field>
        <Field>
          <Label>CPF / CNPJ</Label>
          <Input
            mono
            value={form.cpfCnpj ?? ""}
            onChange={set("cpfCnpj")}
            placeholder="Opcional"
          />
        </Field>
      </div>

      <Field>
        <Label>Endereço</Label>
        <Input
          value={form.address ?? ""}
          onChange={set("address")}
          placeholder="Opcional"
        />
      </Field>

      {error && <ErrorText>{error}</ErrorText>}

      <div className="mt-2 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? <Spinner /> : <Check size={16} />}
          {client ? "Salvar" : "Criar cliente"}
        </Button>
      </div>
    </CardBody>
  );
}
