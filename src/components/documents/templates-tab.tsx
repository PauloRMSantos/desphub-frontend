"use client";

import { useState } from "react";
import {
  Plus,
  FileText,
  Trash2,
  Sparkles,
  Wand2,
  ClipboardPaste,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { useAuth } from "@/components/auth/auth-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import {
  getTemplates,
  getTemplate,
  deleteTemplate,
  aiTemplateFromText,
  aiTemplateFromDescription,
} from "@/lib/data";
import { ApiError } from "@/lib/data/http";
import type { CreateTemplateDTO, Template, TemplateCategory } from "@/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorText } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { TemplateEditor } from "./template-editor";

const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  PROCURACAO: "Procuração",
  DECLARACAO: "Declaração",
  OUTRO: "Outro",
};

type AiMode = "text" | "description";

export function TemplatesTab() {
  const { can } = useAuth();
  const canWrite = can("TEMPLATES_WRITE");
  const { confirm } = useConfirm();
  const templates = useResource(getTemplates, []);

  const [editing, setEditing] = useState<Template | null>(null);
  const [draft, setDraft] = useState<CreateTemplateDTO | null>(null);
  const [inEditor, setInEditor] = useState(false);
  const [opening, setOpening] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode | null>(null);

  function openNew() {
    setEditing(null);
    setDraft(null);
    setInEditor(true);
  }

  async function openEdit(id: number) {
    setOpening(true);
    try {
      const full = await getTemplate(id);
      setEditing(full);
      setDraft(null);
      setInEditor(true);
    } finally {
      setOpening(false);
    }
  }

  function openWithDraft(d: CreateTemplateDTO) {
    setEditing(null);
    setDraft(d);
    setInEditor(true);
  }

  async function remove(id: number, name: string) {
    const ok = await confirm({
      title: "Excluir modelo",
      message: `Excluir o modelo "${name}"? Documentos já gerados não são afetados.`,
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    await deleteTemplate(id);
    templates.reload();
  }

  if (inEditor) {
    return (
      <TemplateEditor
        template={editing}
        draft={draft}
        onDone={() => {
          templates.reload();
          setInEditor(false);
        }}
        onCancel={() => setInEditor(false)}
      />
    );
  }

  const list = templates.data ?? [];

  return (
    <>
      {canWrite && (
        <div className="mb-4 flex flex-wrap gap-2.5">
          <Button onClick={openNew} disabled={opening}>
            <Plus size={16} />
            Novo modelo
          </Button>
          <Button variant="soft" onClick={() => setAiMode("text")}>
            <ClipboardPaste size={16} />
            IA: estruturar meu texto
          </Button>
          <Button variant="soft" onClick={() => setAiMode("description")}>
            <Wand2 size={16} />
            IA: gerar por descrição
          </Button>
          {opening && <Spinner />}
        </div>
      )}

      <Card>
        {templates.loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : templates.error ? (
          <EmptyState
            icon={<FileText size={30} />}
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
            action={
              <Button variant="ghost" size="sm" onClick={templates.reload}>
                Tentar novamente
              </Button>
            }
          />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<FileText size={30} />}
            title="Nenhum modelo"
            description="Crie um modelo de documento para gerar procurações, declarações e mais."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Categoria</th>
                {canWrite && <th className="w-14" />}
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr
                  key={t.id}
                  className={canWrite ? "cursor-pointer" : undefined}
                  onClick={canWrite ? () => openEdit(t.id) : undefined}
                >
                  <td className="font-semibold">{t.name}</td>
                  <td className="text-text-2">{CATEGORY_LABEL[t.category]}</td>
                  {canWrite && (
                    <td>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          aria-label="Excluir"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(t.id, t.name);
                          }}
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

      {aiMode && (
        <AiModal
          mode={aiMode}
          onClose={() => setAiMode(null)}
          onSuggestion={(d) => {
            setAiMode(null);
            openWithDraft(d);
          }}
        />
      )}
    </>
  );
}

function AiModal({
  mode,
  onClose,
  onSuggestion,
}: {
  mode: AiMode;
  onClose: () => void;
  onSuggestion: (draft: CreateTemplateDTO) => void;
}) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("PROCURACAO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!text.trim()) {
      setError("Preencha o campo para a IA.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const draft =
        mode === "text"
          ? await aiTemplateFromText({ rawText: text.trim(), category })
          : await aiTemplateFromDescription({
              description: text.trim(),
              category,
            });
      if (draft) onSuggestion(draft);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError("A IA não está configurada no servidor.");
      } else if (err instanceof ApiError && err.status === 502) {
        setError("A IA respondeu num formato inesperado. Tente novamente.");
      } else {
        setError("Não foi possível gerar a sugestão.");
      }
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      icon={<Sparkles size={18} className="text-link-blue" />}
      title={
        mode === "text"
          ? "Estruturar meu texto com IA"
          : "Gerar modelo por descrição"
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={run} disabled={loading}>
            {loading ? <Spinner /> : <Sparkles size={16} />}
            Gerar sugestão
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-[12.5px] text-text-3">
          A IA devolve uma sugestão de modelo que abre no editor para você
          revisar e salvar. Nada é salvo automaticamente.
        </p>
        <Field>
          <Label>Categoria</Label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as TemplateCategory)}
          >
            <option value="PROCURACAO">Procuração</option>
            <option value="DECLARACAO">Declaração</option>
            <option value="OUTRO">Outro</option>
          </Select>
        </Field>
        <Field>
          <Label required>
            {mode === "text" ? "Cole o documento atual" : "Descreva o modelo"}
          </Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[180px]"
            placeholder={
              mode === "text"
                ? "PROCURAÇÃO… (cole aqui o texto que você já usa)"
                : "Ex.: procuração de transferência com poder de dirigir e responder multas"
            }
          />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
      </div>
    </Modal>
  );
}
