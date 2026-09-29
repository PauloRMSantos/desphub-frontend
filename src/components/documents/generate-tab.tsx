"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Check, Download, RotateCcw, Info } from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import {
  getTemplates,
  getTemplate,
  getClients,
  getVehicles,
  generateDocument,
  downloadDocumentPdf,
} from "@/lib/data";
import { ApiError } from "@/lib/data/http";
import type { GeneratedDocument, Template } from "@/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorText } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";

export function GenerateTab() {
  const templates = useResource(getTemplates, []);
  const clients = useResource(getClients, []);
  const vehicles = useResource(getVehicles, []);

  const [templateId, setTemplateId] = useState<number | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [clientId, setClientId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [groupSelections, setGroupSelections] = useState<
    Record<string, number[]>
  >({});
  const [manualValues, setManualValues] = useState<Record<string, string>>({});

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedDocument | null>(null);

  useEffect(() => {
    if (templateId == null) {
      setTemplate(null);
      return;
    }
    let active = true;
    setLoadingTemplate(true);
    setResult(null);
    getTemplate(templateId)
      .then((t) => {
        if (!active) return;
        setTemplate(t);
        const sel: Record<string, number[]> = {};
        for (const g of t.groups) {
          const defaults = g.blocks
            .filter((b) => b.defaultSelected)
            .map((b) => b.id);
          sel[g.key] =
            g.selectionType === "SINGLE" ? defaults.slice(0, 1) : defaults;
        }
        setGroupSelections(sel);
        setManualValues({});
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar o modelo.");
      })
      .finally(() => {
        if (active) setLoadingTemplate(false);
      });
    return () => {
      active = false;
    };
  }, [templateId]);

  const activeTemplates = (templates.data ?? []).filter((t) => t.active);
  const clientVehicles = (vehicles.data ?? []).filter(
    (v) => v.clientId === clientId,
  );

  const manualVars = template?.variables.filter((v) => v.source === "MANUAL") ?? [];
  const needsVehicle =
    template?.variables.some((v) => v.source === "VEHICLE") ?? false;
  const vehicleRequired =
    template?.variables.some((v) => v.source === "VEHICLE" && v.required) ??
    false;

  const selectedBlockIds = useMemo(
    () => Object.values(groupSelections).flat(),
    [groupSelections],
  );

  function toggleBlock(
    groupKey: string,
    blockId: number,
    single: boolean,
  ) {
    setGroupSelections((p) => {
      const current = p[groupKey] ?? [];
      if (single) return { ...p, [groupKey]: [blockId] };
      return {
        ...p,
        [groupKey]: current.includes(blockId)
          ? current.filter((id) => id !== blockId)
          : [...current, blockId],
      };
    });
  }

  async function generate() {
    if (!template || !clientId) {
      setError("Selecione o modelo e o cliente.");
      return;
    }
    if (vehicleRequired && !vehicleId) {
      setError("Este modelo exige um veículo.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const doc = await generateDocument({
        templateId: template.id,
        clientId,
        vehicleId: needsVehicle ? vehicleId : null,
        selectedBlockIds,
        manualValues,
      });
      setResult(doc);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError(
          "Revise as opções: verifique grupos obrigatórios e campos manuais.",
        );
      } else {
        setError("Não foi possível gerar o documento.");
      }
    } finally {
      setGenerating(false);
    }
  }

  function reset() {
    setResult(null);
  }

  if (result) {
    return (
      <Card className="fade-in overflow-hidden">
        <CardHeader>
          <FileText size={18} className="text-link-blue" />
          <CardTitle>Documento gerado</CardTitle>
          <div className="ml-auto flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                downloadDocumentPdf(
                  result.id,
                  `${result.templateName || "documento"}.pdf`,
                )
              }
            >
              <Download size={15} />
              Baixar PDF
            </Button>
            <Button size="sm" onClick={reset}>
              <RotateCcw size={15} />
              Gerar outro
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="mb-3 text-[12.5px] text-text-3">
            {result.templateName} · {result.clientName}
          </div>
          <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-soft p-5 font-sans text-[13.5px] leading-relaxed text-text-1">
            {result.resolvedContent}
          </pre>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="fade-in flex flex-col gap-4">
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <Label required>Modelo</Label>
            <Select
              value={templateId ?? ""}
              onChange={(e) =>
                setTemplateId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Selecione o modelo…</option>
              {activeTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
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
              {(clients.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          {needsVehicle && (
            <Field>
              <Label required={vehicleRequired}>Veículo</Label>
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
          )}
        </CardBody>
      </Card>

      {loadingTemplate && (
        <Card>
          <CardBody className="flex items-center gap-2 text-[13px] text-text-2">
            <Spinner />
            Carregando modelo…
          </CardBody>
        </Card>
      )}

      {template && !loadingTemplate && (
        <>
          {template.groups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Opções</CardTitle>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                {template.groups.map((g) => {
                  const single = g.selectionType === "SINGLE";
                  const selected = groupSelections[g.key] ?? [];
                  return (
                    <div key={g.key}>
                      <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-text-1">
                        {g.label}
                        {g.required && (
                          <span className="text-[11px] font-medium text-danger">
                            obrigatório
                          </span>
                        )}
                        <span className="text-[11px] font-normal text-text-3">
                          {single ? "escolha um" : "escolha vários"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {g.blocks.map((b) => (
                          <label
                            key={b.id}
                            className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-2.5 text-[13px] hover:bg-surface-soft"
                          >
                            <input
                              type={single ? "radio" : "checkbox"}
                              name={`group-${g.key}`}
                              checked={selected.includes(b.id)}
                              onChange={() => toggleBlock(g.key, b.id, single)}
                              className="mt-0.5"
                            />
                            <span>
                              <span className="font-medium text-text-1">
                                {b.label}
                              </span>
                              <span className="block whitespace-pre-wrap text-[12px] text-text-3">
                                {b.body}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          )}

          {manualVars.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Campos a preencher</CardTitle>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {manualVars.map((v) => (
                  <Field key={v.key}>
                    <Label required={v.required}>{v.label}</Label>
                    <Input
                      value={manualValues[v.key] ?? ""}
                      onChange={(e) =>
                        setManualValues((p) => ({
                          ...p,
                          [v.key]: e.target.value,
                        }))
                      }
                    />
                  </Field>
                ))}
              </CardBody>
            </Card>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[11.5px] text-text-3">
              <Info size={13} />
              O documento gerado fica no histórico para reimpressão.
            </span>
            <Button onClick={generate} disabled={generating}>
              {generating ? <Spinner /> : <Check size={16} />}
              Gerar documento
            </Button>
          </div>
        </>
      )}

      {!template && !loadingTemplate && activeTemplates.length === 0 && (
        <Card>
          <EmptyState
            icon={<FileText size={30} />}
            title="Nenhum modelo ativo"
            description="Crie e ative um modelo na aba Modelos para gerar documentos."
          />
        </Card>
      )}

      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
