"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Clock, Trash2 } from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import {
  getDocuments,
  getClients,
  getDocument,
  deleteDocument,
  downloadDocumentPdf,
  errorDetail,
} from "@/lib/data";
import type { GeneratedDocument, GeneratedDocumentSummary } from "@/types";
import { formatDateTimeBR } from "@/lib/format";
import { useAuth } from "@/components/auth/auth-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 10;

export function HistoryTab() {
  const clients = useResource(getClients, []);
  const [clientId, setClientId] = useState<number | null>(null);
  const documents = useResource(
    () => getDocuments(clientId ?? undefined),
    [clientId],
  );

  const [detail, setDetail] = useState<GeneratedDocument | null>(null);
  const [opening, setOpening] = useState(false);
  const [page, setPage] = useState(1);

  const { can } = useAuth();
  const canWrite = can("DOCUMENTS_WRITE");
  const { confirm } = useConfirm();
  const toast = useToast();

  async function open(id: number) {
    setOpening(true);
    try {
      setDetail(await getDocument(id));
    } finally {
      setOpening(false);
    }
  }

  async function remove(d: GeneratedDocumentSummary) {
    const ok = await confirm({
      title: "Excluir documento",
      message: `Excluir "${d.templateName}"? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteDocument(d.id);
      toast.success("Documento excluído", d.templateName);
      documents.reload();
    } catch (err) {
      toast.error("Não foi possível excluir o documento", errorDetail(err));
    }
  }

  const list = documents.data ?? [];
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [clientId]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visible = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Card className="fade-in">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Field className="w-full max-w-xs">
            <Label>Filtrar por cliente</Label>
            <div className="mt-1.5">
              <Select
                value={clientId ?? ""}
                onChange={(e) =>
                  setClientId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Todos os clientes</option>
                {(clients.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </Field>
          <span className="ml-auto hidden items-center gap-1.5 text-[12px] text-text-3 sm:flex">
            <Clock size={13} />
            Documentos são mantidos por 30 dias.
          </span>
          {opening && <Spinner />}
        </div>

        {documents.loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : documents.error ? (
          <EmptyState
            icon={<FileText size={30} />}
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
            action={
              <Button variant="ghost" size="sm" onClick={documents.reload}>
                Tentar novamente
              </Button>
            }
          />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<FileText size={30} />}
            title="Nenhum documento"
            description="Os documentos gerados aparecerão aqui."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Cliente</th>
                <th>Gerado em</th>
                <th className="w-14" />
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr
                  key={d.id}
                  className="cursor-pointer"
                  onClick={() => open(d.id)}
                >
                  <td className="font-semibold">{d.templateName}</td>
                  <td className="text-text-2">{d.clientName}</td>
                  <td className="text-text-2">
                    {d.createdAt ? formatDateTimeBR(d.createdAt) : "—"}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label="Baixar PDF"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadDocumentPdf(
                            d.id,
                            `${d.templateName || "documento"}.pdf`,
                          );
                        }}
                        className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-surface-soft hover:text-text-1"
                      >
                        <Download size={16} />
                      </button>
                      {canWrite && (
                        <button
                          type="button"
                          aria-label="Excluir documento"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(d);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
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
          total={list.length}
          onPageChange={setPage}
        />
      </Card>

      {detail && (
        <Modal
          open
          onClose={() => setDetail(null)}
          size="lg"
          icon={<FileText size={18} className="text-link-blue" />}
          title={detail.templateName}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Fechar
              </Button>
              <Button
                onClick={() =>
                  downloadDocumentPdf(
                    detail.id,
                    `${detail.templateName || "documento"}.pdf`,
                  )
                }
              >
                <Download size={16} />
                Baixar PDF
              </Button>
            </>
          }
        >
          <div className="mb-2 text-[12.5px] text-text-3">
            {detail.clientName}
            {detail.createdAt ? ` · ${formatDateTimeBR(detail.createdAt)}` : ""}
          </div>
          <pre className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-soft p-5 font-sans text-[13.5px] leading-relaxed text-text-1">
            {detail.resolvedContent}
          </pre>
        </Modal>
      )}
    </>
  );
}
