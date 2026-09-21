"use client";

import { useState } from "react";
import {
  Search,
  CarFront,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Link2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { queryVehicle } from "@/lib/data";
import type { VehicleQueryResponse } from "@/types";
import { formatPlate, brl, brlDecimal, formatDateTimeBR } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageActions } from "@/components/shell/topbar-actions";
import { GovbrConnection } from "@/components/lookup/govbr-connection";

type Phase = "idle" | "loading" | "done" | "error";

export default function LookupPage() {
  const [plate, setPlate] = useState("");
  const [renavam, setRenavam] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<VehicleQueryResponse | null>(null);

  function reset() {
    setPlate("");
    setRenavam("");
    setResult(null);
    setPhase("idle");
  }

  usePageActions(
    () => (
      <Button variant="ghost" onClick={reset}>
        <RefreshCw size={16} />
        Limpar consulta
      </Button>
    ),
    [],
  );

  async function consult() {
    if (plate.replace(/\W/g, "").length < 7) return;
    setPhase("loading");
    setResult(null);
    try {
      const res = await queryVehicle(plate, renavam || undefined);
      setResult(res);
      setPhase("done");
    } catch {
      setPhase("error");
    }
  }

  const wide = phase === "done";

  return (
    <div
      className="fade-in mx-auto"
      style={{ maxWidth: wide ? 940 : 720 }}
    >
      <div className="mb-4">
        <GovbrConnection />
      </div>

      <Card className="overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#0B1929,#10355c)] px-7 py-6 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-white/10">
              <CarFront size={24} />
            </span>
            <div>
              <div className="font-head text-2xl font-bold leading-none">
                Consulta de Veículo
              </div>
              <div className="mt-1 text-[13px] text-[#9DB4CE]">
                Busca automatizada por placa ou RENAVAM via crawler / RPA
              </div>
            </div>
          </div>
        </div>

        <CardBody className="px-7 py-7">
          <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-[auto_1fr]">
            <div>
              <Label>Placa do veículo</Label>
              <div className="mt-2">
                <PlateInput
                  value={plate}
                  onChange={(v) => setPlate(formatPlate(v))}
                />
              </div>
            </div>
            <div>
              <Label>RENAVAM (opcional)</Label>
              <Input
                mono
                className="mt-2 h-[46px]"
                placeholder="00000000000"
                maxLength={11}
                value={renavam}
                onChange={(e) => setRenavam(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <Button
            block
            size="lg"
            className="mt-5"
            onClick={consult}
            disabled={phase === "loading" || plate.length < 7}
          >
            {phase === "loading" ? <Spinner size={18} /> : <Search size={18} />}
            {phase === "loading" ? "Consultando…" : "Consultar veículo"}
          </Button>

          <div className="mt-3 flex items-center justify-center gap-2 text-[11.5px] text-text-3">
            <Info size={13} />
            A consulta é realizada pelo robô junto aos órgãos de trânsito.
          </div>
        </CardBody>
      </Card>

      {phase === "loading" && (
        <Card className="fade-in mt-4">
          <CardBody>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-link-blue">
              <Spinner />
              Consultando o veículo via RPA…
            </div>
            <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-[9px] w-3/5" />
                  <Skeleton className="h-[15px] w-4/5" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {phase === "error" && (
        <Card className="fade-in mt-4">
          <CardBody className="flex items-center gap-3 text-danger">
            <AlertTriangle size={20} />
            <div>
              <div className="font-semibold text-text-1">
                Não foi possível concluir a consulta
              </div>
              <div className="text-[13px] text-text-2">
                Verifique a placa e tente novamente em instantes.
              </div>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={consult}>
              Tentar novamente
            </Button>
          </CardBody>
        </Card>
      )}

      {phase === "done" && result && <LookupResult data={result} />}
    </div>
  );
}

function LookupResult({ data }: { data: VehicleQueryResponse }) {
  const v = data.vehicle;
  const hasIssues =
    (data.restrictions?.length ?? 0) > 0 || (data.debts?.length ?? 0) > 0;

  const fields: [string, string, boolean?][] = [
    ["Marca / Modelo", v.makeModel],
    ["Ano fab. / modelo", `${v.manufactureYear} / ${v.modelYear}`, true],
    ["Cor", v.color],
    ["Município / UF", `${v.city} / ${v.plateState}`],
    ["Categoria", v.category],
    ["Espécie", v.species],
    ["Tipo", v.type],
    ["Combustível", v.fuel],
    ["RENAVAM", v.renavam, true],
    ["Chassi (VIN)", v.chassis, true],
    ["Situação RENAVAM", v.renavamStatus],
    ["CPF do proprietário", v.ownerCpf, true],
  ];

  return (
    <Card className="fade-in mt-4 overflow-hidden">
      <div
        className="flex items-center justify-between border-b border-border px-6 py-[18px]"
        style={{ background: hasIssues ? "var(--tint-warn)" : "var(--tint-ok)" }}
      >
        <div className="flex items-center gap-4">
          <MiniPlate plate={data.plate || v.plate} />
          <div>
            <div className="font-head text-[21px] font-bold leading-none text-text-1">
              {v.makeModel}
            </div>
            <div className="mt-1 text-[12.5px] text-text-3">
              Resultado da consulta automatizada
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-text-3">
            Situação
          </div>
          <Badge tone={hasIssues ? "warning" : "success"}>
            {hasIssues ? "Com pendências" : "Regular"}
          </Badge>
        </div>
      </div>

      <CardBody>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          {fields.map(([label, value, mono]) => (
            <div key={label}>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-text-3">
                {label}
              </div>
              <div
                className={
                  "text-[14.5px] font-semibold text-text-1 " +
                  (mono ? "font-mono" : "")
                }
              >
                {value || "—"}
              </div>
            </div>
          ))}
        </div>

        {data.licensing && (
          <Section title="Licenciamento">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <MiniField label="Exercício" value={data.licensing.year} />
              <MiniField
                label="Situação"
                value={data.licensing.documentStatus}
              />
              <MiniField label="Documento" value={data.licensing.document} />
              <MiniField label="Vencimento" value={data.licensing.dueDate} />
            </div>
          </Section>
        )}

        {data.violations && (
          <Section title="Infrações">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <ViolationTile label="A vencer" v={data.violations.upcoming} />
              <ViolationTile label="Vencidas" v={data.violations.overdue} />
              <ViolationTile label="Suspensão" v={data.violations.suspended} />
              <ViolationTile
                label="Ag. defesa"
                v={data.violations.awaitingDefense}
              />
              <ViolationTile
                label="Ag. julgamento"
                v={data.violations.awaitingJudgment}
              />
            </div>
          </Section>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-border p-3.5">
            <div className="mb-2 flex items-center gap-2 text-[12.5px] font-bold text-text-2">
              <AlertTriangle size={15} />
              Restrições
            </div>
            {data.restrictions?.length ? (
              <ul className="flex flex-col gap-1.5">
                {data.restrictions.map((r, i) => (
                  <li key={i} className="text-[13px] text-text-1">
                    <span className="font-semibold">{r.type}</span>
                    {r.description ? ` — ${r.description}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-1.5 text-[13px] text-success">
                <CheckCircle2 size={15} />
                Nenhuma restrição ativa
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border p-3.5">
            <div className="mb-2 flex items-center gap-2 text-[12.5px] font-bold text-text-2">
              <FileText size={15} />
              Débitos
            </div>
            {data.debts?.length ? (
              <ul className="flex flex-col gap-1.5">
                {data.debts.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-[13px] text-text-1"
                  >
                    <span>
                      {d.type} {d.year ? `(${d.year})` : ""}
                    </span>
                    <span className="font-mono font-semibold">
                      {brlDecimal(d.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-1.5 text-[13px] text-success">
                <CheckCircle2 size={15} />
                Nenhum débito encontrado
              </div>
            )}
          </div>
        </div>

        {data.taxes?.length > 0 && (
          <Section title="Histórico de IPVA">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-text-3">
                    <th className="py-1.5 font-semibold">Ano</th>
                    <th className="py-1.5 font-semibold">Situação</th>
                    <th className="py-1.5 text-right font-semibold">Valor</th>
                    <th className="py-1.5 font-semibold">Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  {data.taxes.map((t, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2 font-mono">{t.year}</td>
                      <td className="py-2">
                        <span className="flex items-center gap-2">
                          {t.status}
                          {t.activeDebt && (
                            <Badge tone="danger">Dívida ativa</Badge>
                          )}
                        </span>
                      </td>
                      <td className="py-2 text-right font-mono">
                        {brlDecimal(t.amount)}
                      </td>
                      <td className="py-2 text-text-2">{t.dueDate || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {data.errors?.length > 0 && (
          <div className="mt-4 rounded-lg border border-tint-info-border bg-tint-warn p-3.5">
            <div className="mb-1.5 text-[12.5px] font-bold text-warning">
              Etapas com aviso
            </div>
            <ul className="flex flex-col gap-1">
              {data.errors.map((e, i) => (
                <li key={i} className="text-[12px] text-text-2">
                  <span className="font-semibold">{e.step}:</span> {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-text-3">
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            {data.collectedAt
              ? formatDateTimeBR(data.collectedAt)
              : "—"}
          </span>
          {data.source && <span>Fonte: {data.source}</span>}
          {data.jobId && (
            <span className="flex items-center gap-1.5 font-mono">
              <Link2 size={13} />
              {data.jobId}
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 font-head text-[15px] font-bold uppercase tracking-[0.8px] text-text-1">
        {title}
      </div>
      {children}
    </div>
  );
}

function MiniField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-text-3">
        {label}
      </div>
      <div className="text-[13.5px] font-semibold text-text-1">
        {value || "—"}
      </div>
    </div>
  );
}

function ViolationTile({
  label,
  v,
}: {
  label: string;
  v?: { count: number; amount: number };
}) {
  const count = v?.count ?? 0;
  return (
    <div className="rounded-lg border border-border bg-surface-soft p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-text-3">
        {label}
      </div>
      <div className="mt-1 font-head text-[22px] font-bold text-text-1">
        {count}
      </div>
      {count > 0 && (
        <div className="font-mono text-[11.5px] text-text-2">
          {brl(v?.amount ?? 0)}
        </div>
      )}
    </div>
  );
}

function PlateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block w-[280px] cursor-text overflow-hidden rounded-[9px] border-[3px] border-deep bg-white shadow-[0_2px_6px_rgba(11,25,41,0.15)]">
      <div className="flex h-[22px] items-center justify-between bg-blue px-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[1px] text-white">
        <span className="flex items-center gap-1">
          <span className="inline-block h-[9px] w-[13px] rounded-[1px] bg-[linear-gradient(180deg,#16A34A_0_33%,#FACC15_33%_66%,#003F7D_66%)]" />
          BRASIL
        </span>
        <span className="font-bold tracking-[1px]">BR</span>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ABC1D23"
        maxLength={7}
        className="w-full bg-transparent px-0 pb-2.5 pt-2 text-center font-mono text-[32px] font-bold uppercase tracking-[4px] text-[#111827] outline-none placeholder:text-[#c9ced6]"
      />
    </label>
  );
}

function MiniPlate({ plate }: { plate: string }) {
  return (
    <div className="w-[122px] shrink-0 overflow-hidden rounded-md border-[2.5px] border-deep bg-white">
      <div className="flex h-[13px] items-center justify-between bg-blue px-1.5 font-mono text-[6.5px] font-semibold text-white">
        <span className="flex items-center gap-0.5">
          <span className="inline-block h-[5.5px] w-2 rounded-[1px] bg-[linear-gradient(180deg,#16A34A_0_33%,#FACC15_33%_66%,#003F7D_66%)]" />
          BRASIL
        </span>
        <span>BR</span>
      </div>
      <div className="py-[3px] text-center font-mono text-[20px] font-bold tracking-[2px] text-[#111827]">
        {plate?.replace("-", "")}
      </div>
    </div>
  );
}
