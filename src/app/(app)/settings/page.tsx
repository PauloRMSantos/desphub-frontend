"use client";

import { useState } from "react";
import { Plus, Check, Pencil, Trash2, Sun, Moon, Wrench, X } from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { useAuth } from "@/components/auth/auth-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "@/lib/data";
import type { Service } from "@/types";
import { brl } from "@/lib/format";
import { useTheme } from "@/components/theme/theme-provider";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  return (
    <div className="fade-in flex max-w-4xl flex-col gap-4">
      <Appearance />
      {!isAdmin && <ServicesManager />}
    </div>
  );
}

function Appearance() {
  const { theme, setTheme } = useTheme();
  const options: { value: "light" | "dark"; label: string; icon: typeof Sun }[] =
    [
      { value: "light", label: "Claro", icon: Sun },
      { value: "dark", label: "Escuro", icon: Moon },
    ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
      </CardHeader>
      <CardBody>
        <Label>Tema</Label>
        <div className="mt-2 flex gap-3">
          {options.map((o) => {
            const Icon = o.icon;
            const active = theme === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setTheme(o.value)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-input border px-4 py-3 text-sm font-semibold transition-colors",
                  active
                    ? "border-orange bg-orange-50 text-orange-ink"
                    : "border-border-strong text-text-2 hover:bg-surface-soft",
                )}
              >
                <Icon size={17} />
                {o.label}
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function ServicesManager() {
  const { can } = useAuth();
  const { confirm } = useConfirm();
  const canWrite = can("SERVICES_WRITE");
  const services = useResource(getServices, []);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(s: Service) {
    setEditing(s);
    setName(s.serviceName);
    setPrice(String(s.price));
    setError(null);
  }

  function reset() {
    setEditing(null);
    setName("");
    setPrice("");
    setError(null);
  }

  async function submit() {
    if (!name.trim() || !price) {
      setError("Informe nome e preço.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = { serviceName: name.trim(), price: Number(price) };
    try {
      if (editing) await updateService(editing.id, payload);
      else await createService(payload);
      reset();
      services.reload();
    } catch {
      setError("Não foi possível salvar o serviço.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: Service) {
    const ok = await confirm({
      title: "Excluir serviço",
      message: `Excluir o serviço "${s.serviceName}"? Essa ação não pode ser desfeita.`,
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    await deleteService(s.id);
    if (editing?.id === s.id) reset();
    services.reload();
  }

  const list = services.data ?? [];

  return (
    <Card>
      <CardHeader>
        <Wrench size={18} className="text-link-blue" />
        <CardTitle>Catálogo de serviços</CardTitle>
      </CardHeader>

      {canWrite && (
      <CardBody className="border-b border-border">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_160px_auto]">
          <Field>
            <Label required>Serviço</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Transferência de propriedade"
            />
          </Field>
          <Field>
            <Label required>Preço</Label>
            <Input
              mono
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={saving}>
              {saving ? (
                <Spinner />
              ) : editing ? (
                <Check size={16} />
              ) : (
                <Plus size={16} />
              )}
              {editing ? "Salvar" : "Adicionar"}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={reset} disabled={saving}>
                <X size={16} />
              </Button>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-2 text-[12px] font-medium text-danger">{error}</div>
        )}
      </CardBody>
      )}

      {services.loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : services.error ? (
        <EmptyState
          icon={<Wrench size={30} />}
          title="Não foi possível carregar"
          description="Estamos passando por problemas técnicos, pedimos desculpas pelo incoveniente :("
          action={
            <Button variant="ghost" size="sm" onClick={services.reload}>
              Tentar novamente
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Wrench size={30} />}
          title="Nenhum serviço"
          description="Adicione serviços ao catálogo para usar em OS e orçamentos."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Serviço</th>
              <th className="text-right">Preço</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td className="font-semibold">{s.serviceName}</td>
                <td className="text-right font-mono font-semibold">
                  {brl(s.price)}
                </td>
                <td>
                  {canWrite && (
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() => startEdit(s)}
                      className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-surface-soft hover:text-text-1"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir"
                      onClick={() => remove(s)}
                      className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
