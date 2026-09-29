"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  FileText,
  Layers,
  Variable,
  Sparkles,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { useConfirm } from "@/components/providers/confirm-provider";
import {
  createTemplate,
  updateTemplate,
  getVariableCatalog,
} from "@/lib/data";
import type {
  CreateTemplateDTO,
  GroupSelectionType,
  Template,
  TemplateCategory,
  TemplateVariable,
  VariableSource,
} from "@/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorText } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string }[] = [
  { value: "PROCURACAO", label: "Procuração" },
  { value: "DECLARACAO", label: "Declaração" },
  { value: "OUTRO", label: "Outro" },
];

const SOURCE_LABEL: Record<VariableSource, string> = {
  CLIENT: "Cliente",
  VEHICLE: "Veículo",
  OFFICE: "Escritório",
  USER: "Usuário",
  MANUAL: "Manual",
};

let uidCounter = 0;
const uid = () => `u${++uidCounter}`;

interface LocalBlock {
  uid: string;
  label: string;
  body: string;
  defaultSelected: boolean;
}

type Section =
  | { uid: string; kind: "fixed"; block: LocalBlock }
  | {
      uid: string;
      kind: "group";
      key: string;
      label: string;
      selectionType: GroupSelectionType;
      required: boolean;
      blocks: LocalBlock[];
    };

type LocalVariable = { uid: string } & TemplateVariable;

type SourceTemplate = Template | CreateTemplateDTO;

function toBlock(b: {
  label: string;
  body: string;
  defaultSelected?: boolean;
}): LocalBlock {
  return {
    uid: uid(),
    label: b.label,
    body: b.body,
    defaultSelected: b.defaultSelected ?? false,
  };
}

function buildSections(src?: SourceTemplate): Section[] {
  if (!src) return [];
  const tagged: { sortOrder: number; section: Section }[] = [];
  for (const b of src.fixedBlocks ?? []) {
    tagged.push({
      sortOrder: b.sortOrder ?? 0,
      section: { uid: uid(), kind: "fixed", block: toBlock(b) },
    });
  }
  for (const g of src.groups ?? []) {
    tagged.push({
      sortOrder: g.sortOrder ?? 0,
      section: {
        uid: uid(),
        kind: "group",
        key: g.key,
        label: g.label,
        selectionType: g.selectionType,
        required: g.required ?? false,
        blocks: (g.blocks ?? []).map(toBlock),
      },
    });
  }
  tagged.sort((a, b) => a.sortOrder - b.sortOrder);
  return tagged.map((t) => t.section);
}

function buildVariables(src?: SourceTemplate): LocalVariable[] {
  return (src?.variables ?? []).map((v) => ({
    uid: uid(),
    key: v.key,
    label: v.label,
    source: v.source,
    sourceField: v.sourceField ?? null,
    required: v.required ?? false,
  }));
}

export function TemplateEditor({
  template,
  draft,
  onDone,
  onCancel,
}: {
  template: Template | null;
  draft?: CreateTemplateDTO | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const source = template ?? draft ?? undefined;
  const [name, setName] = useState(source?.name ?? "");
  const [category, setCategory] = useState<TemplateCategory>(
    source?.category ?? "PROCURACAO",
  );
  const [active] = useState(source?.active ?? true);
  const [sections, setSections] = useState<Section[]>(() =>
    buildSections(source),
  );
  const [variables, setVariables] = useState<LocalVariable[]>(() =>
    buildVariables(source),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { confirm } = useConfirm();
  const catalog = useResource(getVariableCatalog, []);

  function move(i: number, dir: -1 | 1) {
    setSections((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function addFixed() {
    setSections((p) => [
      ...p,
      {
        uid: uid(),
        kind: "fixed",
        block: { uid: uid(), label: "", body: "", defaultSelected: false },
      },
    ]);
  }

  function addGroup() {
    setSections((p) => [
      ...p,
      {
        uid: uid(),
        kind: "group",
        key: "",
        label: "",
        selectionType: "SINGLE",
        required: false,
        blocks: [{ uid: uid(), label: "", body: "", defaultSelected: false }],
      },
    ]);
  }

  async function removeSection(i: number) {
    const s = sections[i];
    const label =
      s.kind === "fixed"
        ? s.block.label.trim() || "bloco fixo"
        : s.label.trim() || "grupo opcional";
    const ok = await confirm({
      title: "Remover bloco",
      message: `Remover "${label}"? Essa ação não pode ser desfeita.`,
      confirmText: "Remover",
      tone: "danger",
    });
    if (!ok) return;
    setSections((p) => p.filter((_, idx) => idx !== i));
  }

  function patchSection(i: number, patch: Partial<Section>) {
    setSections((p) =>
      p.map((s, idx) => (idx === i ? ({ ...s, ...patch } as Section) : s)),
    );
  }

  function patchFixedBlock(i: number, patch: Partial<LocalBlock>) {
    setSections((p) =>
      p.map((s, idx) =>
        idx === i && s.kind === "fixed"
          ? { ...s, block: { ...s.block, ...patch } }
          : s,
      ),
    );
  }

  function patchGroupBlock(i: number, bi: number, patch: Partial<LocalBlock>) {
    setSections((p) =>
      p.map((s, idx) =>
        idx === i && s.kind === "group"
          ? {
              ...s,
              blocks: s.blocks.map((b, j) =>
                j === bi ? { ...b, ...patch } : b,
              ),
            }
          : s,
      ),
    );
  }

  function addGroupBlock(i: number) {
    setSections((p) =>
      p.map((s, idx) =>
        idx === i && s.kind === "group"
          ? {
              ...s,
              blocks: [
                ...s.blocks,
                { uid: uid(), label: "", body: "", defaultSelected: false },
              ],
            }
          : s,
      ),
    );
  }

  async function removeGroupBlock(i: number, bi: number) {
    const s = sections[i];
    const label =
      s.kind === "group" ? s.blocks[bi]?.label.trim() || "opção" : "opção";
    const ok = await confirm({
      title: "Remover opção",
      message: `Remover a opção "${label}"?`,
      confirmText: "Remover",
      tone: "danger",
    });
    if (!ok) return;
    setSections((p) =>
      p.map((s, idx) =>
        idx === i && s.kind === "group"
          ? { ...s, blocks: s.blocks.filter((_, j) => j !== bi) }
          : s,
      ),
    );
  }

  function addVariable(v?: Partial<LocalVariable>) {
    setVariables((p) => [
      ...p,
      {
        uid: uid(),
        key: v?.key ?? "",
        label: v?.label ?? "",
        source: v?.source ?? "MANUAL",
        sourceField: v?.sourceField ?? null,
        required: v?.required ?? false,
      },
    ]);
  }

  function patchVariable(i: number, patch: Partial<LocalVariable>) {
    setVariables((p) =>
      p.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    );
  }

  function removeVariable(i: number) {
    setVariables((p) => p.filter((_, idx) => idx !== i));
  }

  const usedKeys = useMemo(
    () => new Set(variables.map((v) => v.key)),
    [variables],
  );

  function buildPayload(): CreateTemplateDTO {
    let base = 0;
    const fixedBlocks: CreateTemplateDTO["fixedBlocks"] = [];
    const groups: CreateTemplateDTO["groups"] = [];
    for (const s of sections) {
      if (s.kind === "fixed") {
        fixedBlocks.push({
          label: s.block.label.trim(),
          body: s.block.body,
          sortOrder: base,
        });
      } else {
        groups.push({
          key: s.key.trim(),
          label: s.label.trim(),
          selectionType: s.selectionType,
          required: s.required,
          sortOrder: base,
          blocks: s.blocks.map((b, j) => ({
            label: b.label.trim(),
            body: b.body,
            sortOrder: base + 1 + j,
            defaultSelected: b.defaultSelected,
          })),
        });
      }
      base += 100;
    }
    return {
      name: name.trim(),
      category,
      active,
      fixedBlocks,
      groups,
      variables: variables.map((v) => ({
        key: v.key.trim(),
        label: v.label.trim(),
        source: v.source,
        sourceField: v.source === "MANUAL" ? null : v.sourceField || null,
        required: v.required,
      })),
    };
  }

  async function submit() {
    if (!name.trim()) {
      setError("Informe o nome do modelo.");
      return;
    }
    if (sections.length === 0) {
      setError("Adicione ao menos um bloco.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = buildPayload();
    try {
      if (template) await updateTemplate(template.id, payload);
      else await createTemplate(payload);
      onDone();
    } catch {
      setError("Não foi possível salvar o modelo.");
      setSaving(false);
    }
  }

  return (
    <div className="fade-in flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="self-start" onClick={onCancel}>
        <ChevronLeft size={15} />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <FileText size={18} className="text-link-blue" />
          <CardTitle>{template ? "Editar modelo" : "Novo modelo"}</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
          <Field>
            <Label required>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Procuração de Transferência"
            />
          </Field>
          <Field>
            <Label>Categoria</Label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as TemplateCategory)}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Layers size={18} className="text-link-blue" />
          <CardTitle>Blocos do documento</CardTitle>
          <div className="ml-auto flex gap-2">
            <Button variant="soft" size="sm" onClick={addFixed}>
              <Plus size={15} />
              Bloco fixo
            </Button>
            <Button variant="soft" size="sm" onClick={addGroup}>
              <Plus size={15} />
              Grupo opcional
            </Button>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <p className="text-[12px] text-text-3">
            A ordem abaixo é a ordem no documento. Use{" "}
            <code className="font-mono">{"{{chave}}"}</code> no texto para inserir
            variáveis.
          </p>
          {sections.length === 0 && (
            <div className="rounded-lg border border-dashed border-border-strong p-6 text-center text-[13px] text-text-3">
              Nenhum bloco ainda. Adicione um bloco fixo ou um grupo opcional.
            </div>
          )}
          {sections.map((s, i) => (
            <div
              key={s.uid}
              className="rounded-lg border border-border p-3.5"
            >
              <div className="mb-2.5 flex items-center gap-2">
                <Badge tone={s.kind === "fixed" ? "info" : "warning"}>
                  {s.kind === "fixed" ? "Bloco fixo" : "Grupo opcional"}
                </Badge>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Mover para cima"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-surface-soft hover:text-text-1 disabled:opacity-40"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Mover para baixo"
                    onClick={() => move(i, 1)}
                    disabled={i === sections.length - 1}
                    className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-surface-soft hover:text-text-1 disabled:opacity-40"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Remover"
                    onClick={() => removeSection(i)}
                    className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {s.kind === "fixed" ? (
                <div className="flex flex-col gap-2.5">
                  <Input
                    value={s.block.label}
                    onChange={(e) =>
                      patchFixedBlock(i, { label: e.target.value })
                    }
                    placeholder="Rótulo (ex.: Abertura)"
                  />
                  <Textarea
                    value={s.block.body}
                    onChange={(e) =>
                      patchFixedBlock(i, { body: e.target.value })
                    }
                    placeholder="Texto do bloco. Ex.: OUTORGANTE: {{cliente.nome}}…"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_1fr_160px]">
                    <Input
                      value={s.label}
                      onChange={(e) => patchSection(i, { label: e.target.value })}
                      placeholder="Rótulo do grupo (ex.: Transferência)"
                    />
                    <Input
                      mono
                      value={s.key}
                      onChange={(e) =>
                        patchSection(i, {
                          key: e.target.value.replace(/\s/g, "_").toLowerCase(),
                        })
                      }
                      placeholder="chave (ex.: transferencia)"
                    />
                    <Select
                      value={s.selectionType}
                      onChange={(e) =>
                        patchSection(i, {
                          selectionType: e.target.value as GroupSelectionType,
                        })
                      }
                    >
                      <option value="SINGLE">Escolher um</option>
                      <option value="MULTI">Escolher vários</option>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 text-[13px] text-text-2">
                    <input
                      type="checkbox"
                      checked={s.required}
                      onChange={(e) =>
                        patchSection(i, { required: e.target.checked })
                      }
                    />
                    Obrigatório escolher ao menos uma opção
                  </label>

                  <div className="flex flex-col gap-2 rounded-md border border-border p-2.5">
                    {s.blocks.map((b, bi) => (
                      <div
                        key={b.uid}
                        className="flex flex-col gap-2 border-b border-border pb-2 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            value={b.label}
                            onChange={(e) =>
                              patchGroupBlock(i, bi, { label: e.target.value })
                            }
                            placeholder="Opção (ex.: Em nome do proprietário)"
                          />
                          <label className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] text-text-3">
                            <input
                              type="checkbox"
                              checked={b.defaultSelected}
                              onChange={(e) =>
                                patchGroupBlock(i, bi, {
                                  defaultSelected: e.target.checked,
                                })
                              }
                            />
                            Padrão
                          </label>
                          <button
                            type="button"
                            aria-label="Remover opção"
                            onClick={() => removeGroupBlock(i, bi)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <Textarea
                          value={b.body}
                          onChange={(e) =>
                            patchGroupBlock(i, bi, { body: e.target.value })
                          }
                          placeholder="Texto da opção. Ex.: - transferir em nome do proprietário;"
                        />
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start"
                      onClick={() => addGroupBlock(i)}
                    >
                      <Plus size={14} />
                      Adicionar opção
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Variable size={18} className="text-link-blue" />
          <CardTitle>Variáveis</CardTitle>
          <Button
            variant="soft"
            size="sm"
            className="ml-auto"
            onClick={() => addVariable()}
          >
            <Plus size={15} />
            Variável manual
          </Button>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {catalog.data && catalog.data.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="mr-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-text-3">
                <Sparkles size={12} />
                Automáticas:
              </span>
              {catalog.data.map((c) => {
                const added = usedKeys.has(c.suggestedKey);
                return (
                  <button
                    key={`${c.source}-${c.sourceField}`}
                    type="button"
                    disabled={added}
                    onClick={() =>
                      addVariable({
                        key: c.suggestedKey,
                        label: c.label,
                        source: c.source,
                        sourceField: c.sourceField,
                      })
                    }
                    className="rounded-full border border-border-strong px-2.5 py-1 text-[12px] text-text-2 hover:bg-surface-soft disabled:opacity-40"
                  >
                    + {c.label}
                  </button>
                );
              })}
            </div>
          )}

          {variables.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong p-4 text-center text-[13px] text-text-3">
              Nenhuma variável. Adicione as automáticas acima ou uma manual.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {variables.map((v, i) => (
                <div
                  key={v.uid}
                  className="grid grid-cols-1 items-center gap-2 rounded-md border border-border p-2.5 sm:grid-cols-[160px_1fr_130px_90px_auto]"
                >
                  <Input
                    mono
                    value={v.key}
                    onChange={(e) => patchVariable(i, { key: e.target.value })}
                    placeholder="chave"
                  />
                  <Input
                    value={v.label}
                    onChange={(e) => patchVariable(i, { label: e.target.value })}
                    placeholder="Rótulo"
                  />
                  <span className="text-[12.5px] text-text-3">
                    {SOURCE_LABEL[v.source]}
                    {v.source !== "MANUAL" && v.sourceField
                      ? ` · ${v.sourceField}`
                      : ""}
                  </span>
                  <label className="flex items-center gap-1.5 text-[12px] text-text-3">
                    <input
                      type="checkbox"
                      checked={v.required}
                      onChange={(e) =>
                        patchVariable(i, { required: e.target.checked })
                      }
                    />
                    Obrig.
                  </label>
                  <button
                    type="button"
                    aria-label="Remover variável"
                    onClick={() => removeVariable(i)}
                    className="grid h-8 w-8 place-items-center justify-self-end rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {error && <ErrorText>{error}</ErrorText>}

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? <Spinner /> : <Check size={16} />}
          {template ? "Salvar alterações" : "Salvar modelo"}
        </Button>
      </div>
    </div>
  );
}
