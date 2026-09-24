"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Check,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import {
  getExpenses,
  getServiceOrders,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/data";
import type { ExpenseItem } from "@/types";
import { brl, brlNumber, isoToBR } from "@/lib/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/auth/auth-provider";
import { useConfirm } from "@/components/providers/confirm-provider";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function FinancePage() {
  const { can } = useAuth();
  const canWrite = can("FINANCIAL_WRITE");
  const [month, setMonth] = useState(currentMonth());
  const { from, to } = useMemo(() => monthBounds(month), [month]);

  const expenses = useResource(() => getExpenses({ from, to }), [from, to]);
  const orders = useResource(getServiceOrders, []);

  const revenue = useMemo(() => {
    return (orders.data ?? [])
      .filter((o) => o.orderStatus === "CONCLUIDA")
      .filter((o) => {
        const day = o.createdAt?.slice(0, 10);
        return day ? day >= from && day <= to : false;
      })
      .reduce((acc, o) => acc + o.total, 0);
  }, [orders.data, from, to]);

  const expensesList = expenses.data ?? [];
  const expensesTotal = expensesList.reduce((acc, e) => acc + e.amount, 0);
  const net = revenue - expensesTotal;

  return (
    <div className="fade-in flex flex-col gap-5">
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-3">
              Período
            </div>
            <div className="mt-0.5 font-head text-[20px] font-bold text-text-1">
              {monthLabel(month)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Mês anterior"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value || currentMonth())}
              className="w-[170px]"
            />
            <Button
              variant="ghost"
              size="sm"
              aria-label="Próximo mês"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Receita"
          currency="R$"
          value={brlNumber(revenue)}
          foot="OS concluídas no mês"
        />
        <KpiCard
          label="Despesas"
          currency="R$"
          value={brlNumber(expensesTotal)}
          foot="Lançamentos do mês"
        />
        <KpiCard
          hero
          label="Total líquido"
          currency="R$"
          value={brlNumber(net)}
          foot={net >= 0 ? "Resultado positivo" : "Resultado negativo"}
        />
      </div>

      <ExpensesManager
        month={month}
        expenses={expensesList}
        loading={expenses.loading}
        error={!!expenses.error}
        canWrite={canWrite}
        onReload={expenses.reload}
      />
    </div>
  );
}

function ExpensesManager({
  month,
  expenses,
  loading,
  error,
  canWrite,
  onReload,
}: {
  month: string;
  expenses: ExpenseItem[];
  loading: boolean;
  error: boolean;
  canWrite: boolean;
  onReload: () => void;
}) {
  const { confirm } = useConfirm();
  const [editing, setEditing] = useState<ExpenseItem | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(`${month}-01`);
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function reset() {
    setEditing(null);
    setDescription("");
    setAmount("");
    setDate(`${month}-01`);
    setCategory("");
    setFormError(null);
  }

  function startEdit(e: ExpenseItem) {
    setEditing(e);
    setDescription(e.description);
    setAmount(String(e.amount));
    setDate(e.date.slice(0, 10));
    setCategory(e.category ?? "");
    setFormError(null);
  }

  async function submit() {
    if (!description.trim() || !amount || !date) {
      setFormError("Informe descrição, valor e data.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      description: description.trim(),
      amount: Number(amount),
      date,
      category: category.trim() || undefined,
    };
    try {
      if (editing) await updateExpense(editing.id, payload);
      else await createExpense(payload);
      reset();
      onReload();
    } catch {
      setFormError("Não foi possível salvar a despesa.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(e: ExpenseItem) {
    const ok = await confirm({
      title: "Excluir despesa",
      message: `Excluir a despesa "${e.description}"? Essa ação não pode ser desfeita.`,
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    await deleteExpense(e.id);
    if (editing?.id === e.id) reset();
    onReload();
  }

  return (
    <Card>
      <CardHeader>
        <Wallet size={18} className="text-link-blue" />
        <CardTitle>Despesas</CardTitle>
      </CardHeader>

      {canWrite && (
        <CardBody className="border-b border-border">
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_150px_160px_150px_auto]">
            <Field>
              <Label required>Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Aluguel, taxa DETRAN…"
              />
            </Field>
            <Field>
              <Label required>Valor</Label>
              <Input
                mono
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field>
              <Label required>Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field>
              <Label>Categoria</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Opcional"
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
          {formError && (
            <div className="mt-2 text-[12px] font-medium text-danger">
              {formError}
            </div>
          )}
        </CardBody>
      )}

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<Wallet size={30} />}
          title="Não foi possível carregar"
          description="Estamos passando por problemas técnicos, pedimos desculpas pelo incoveniente :("
          action={
            <Button variant="ghost" size="sm" onClick={onReload}>
              Tentar novamente
            </Button>
          }
        />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<Wallet size={30} />}
          title="Nenhuma despesa no período"
          description="Lance as despesas do mês para acompanhar o resultado."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Data</th>
              <th className="text-right">Valor</th>
              {canWrite && <th className="w-24" />}
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="font-semibold">{e.description}</td>
                <td className="text-text-2">{e.category || "—"}</td>
                <td className="font-mono text-[12.5px] text-text-2">
                  {isoToBR(e.date.slice(0, 10))}
                </td>
                <td className="text-right font-mono font-semibold">
                  {brl(e.amount)}
                </td>
                {canWrite && (
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => startEdit(e)}
                        className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-surface-soft hover:text-text-1"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Excluir"
                        onClick={() => remove(e)}
                        className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 size={15} />
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
