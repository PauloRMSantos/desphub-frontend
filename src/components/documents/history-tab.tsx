"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import {
  getDocuments,
  getClients,
  getDocument,
  downloadDocumentPdf,
} from "@/lib/data";
import type { GeneratedDocument } from "@/types";
import { formatDateTimeBR } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";

export function HistoryTab() {
  const clients = useResource(getClients, []);
  const [clientId, setClientId] = useState<number | null>(null);
  const documents = useResource(
    () => getDocuments(clientId ?? undefined),
    [clientId],
  );

  const [detail, setDetail] = useState<GeneratedDocument | null>(null);
  const [opening, setOpening] = useState(false);

  async function open(id: number) {
    setOpening(true);
    try {
      setDetail(await getDocument(id));
    } finally {
      setOpening(false);
    }
  }

  const list = documents.data ?? [];

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
              {list.map((d) => (
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
                    <div className="flex justify-end">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
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
