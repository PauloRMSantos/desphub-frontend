"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Check, Trash2, Building2, Ban, ChevronLeft } from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { useAuth } from "@/components/auth/auth-provider";
import {
  getOffices,
  createOffice,
  deleteOffice,
  errorDetail,
} from "@/lib/data";
import type { CreateOfficeDTO } from "@/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorText } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DocInput } from "@/components/ui/masked-input";
import { maskCpfCnpj, onlyDigits } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { usePageActions } from "@/components/shell/topbar-actions";
import { useConfirm } from "@/components/providers/confirm-provider";
import { useToast } from "@/components/providers/toast-provider";

const PAGE_SIZE = 10;

export default function OfficesPage() {
  const { isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const toast = useToast();
  const offices = useResource(
    () => (isAdmin ? getOffices() : Promise.resolve([])),
    [isAdmin],
  );
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const list = offices.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = onlyDigits(query);
    if (!q) return list;
    return list.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.cpfCnpj ?? "").toLowerCase().includes(q) ||
        (qDigits.length > 0 && onlyDigits(o.cpfCnpj ?? "").includes(qDigits)),
    );
  }, [list, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  usePageActions(
    () =>
      isAdmin ? (
        <Button onClick={() => setCreating(true)}>
          <Plus size={17} />
          Novo escritório
        </Button>
      ) : null,
    [isAdmin],
  );

  if (!isAdmin) {
    return (
      <Card className="fade-in">
        <EmptyState
          icon={<Ban size={30} />}
          title="Acesso negado"
          description="Apenas administradores DespHub podem gerenciar escritórios."
        />
      </Card>
    );
  }

  if (creating) {
    return (
      <OfficeForm
        onDone={() => {
          offices.reload();
          setCreating(false);
        }}
        onCancel={() => setCreating(false)}
      />
    );
  }

  async function remove(id: number, name: string) {
    const ok = await confirm({
      title: "Excluir escritório",
      message: `Excluir o escritório "${name}"? Essa ação não pode ser desfeita.`,
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteOffice(id);
      offices.reload();
      toast.success("Escritório excluído", name);
    } catch (err) {
      toast.error("Não foi possível excluir o escritório", errorDetail(err));
    }
  }

  return (
    <Card className="fade-in">
      {offices.loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : offices.error ? (
        <EmptyState
          icon={<Building2 size={30} />}
          title="Não foi possível carregar"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button variant="ghost" size="sm" onClick={offices.reload}>
              Tentar novamente
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Building2 size={30} />}
          title="Nenhum escritório"
          description="Cadastre o primeiro escritório."
        />
      ) : (
        <>
          <div className="border-b border-border p-4">
            <SearchInput
              placeholder="Buscar por nome ou CPF/CNPJ…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              wrapperClassName="w-full"
            />
            <div className="mt-3 text-[12.5px] text-text-3">
              {filtered.length}{" "}
              {filtered.length === 1 ? "escritório" : "escritórios"}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Building2 size={30} />}
              title="Nenhum escritório encontrado"
              description="Ajuste a busca e tente novamente."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Escritório</th>
                  <th>CPF / CNPJ</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => (
                  <tr key={o.id}>
                    <td className="font-semibold">{o.name}</td>
                    <td className="font-mono text-[12.5px] text-text-2">
                      {o.cpfCnpj ? maskCpfCnpj(o.cpfCnpj) : "—"}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          aria-label="Excluir"
                          onClick={() => remove(o.id, o.name)}
                          className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
    </Card>
  );
}

function OfficeForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const errName = touched && !name.trim();
  const errDoc = touched && !cpfCnpj.trim();

  async function submit() {
    setTouched(true);
    if (!name.trim() || !cpfCnpj.trim()) {
      toast.error("Campos obrigatórios faltando", "nome e CPF/CNPJ");
      return;
    }
    setSaving(true);
    const payload: CreateOfficeDTO = {
      name: name.trim(),
      cpfCnpj: cpfCnpj.trim(),
    };
    try {
      await createOffice(payload);
      toast.success("Escritório criado", payload.name);
      onDone();
    } catch (err) {
      toast.error("Não foi possível criar o escritório", errorDetail(err));
      setSaving(false);
    }
  }

  return (
    <div className="fade-in max-w-[560px]">
      <Button variant="ghost" size="sm" className="mb-3.5" onClick={onCancel}>
        <ChevronLeft size={15} />
        Voltar à lista
      </Button>
      <Card>
        <CardHeader>
          <Building2 size={18} className="text-link-blue" />
          <CardTitle>Novo escritório</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <Field>
            <Label required>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              state={errName ? "error" : "default"}
              placeholder="Nome do escritório"
            />
            {errName && <ErrorText>Campo obrigatório</ErrorText>}
          </Field>
          <Field>
            <Label required>CPF / CNPJ</Label>
            <DocInput
              mono
              value={cpfCnpj}
              onValueChange={setCpfCnpj}
              state={errDoc ? "error" : "default"}
              placeholder="CPF (autônomo) ou CNPJ (empresa)"
            />
            {errDoc && <ErrorText>Campo obrigatório</ErrorText>}
          </Field>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <Spinner /> : <Check size={16} />}
              Criar escritório
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
