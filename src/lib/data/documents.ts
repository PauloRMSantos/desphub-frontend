import type {
  GenerateDocumentDTO,
  GeneratedDocument,
  GeneratedDocumentSummary,
} from "@/types";
import { apiGet, apiGetBlob, apiSend } from "./http";

export function generateDocument(data: GenerateDocumentDTO) {
  return apiSend<GeneratedDocument>("POST", "/documents/generate", data);
}

export function getDocuments(
  clientId?: number,
): Promise<GeneratedDocumentSummary[]> {
  return apiGet<GeneratedDocumentSummary[]>("/documents", { clientId });
}

export function getDocument(id: number): Promise<GeneratedDocument> {
  return apiGet<GeneratedDocument>(`/documents/${id}`);
}

export async function downloadDocumentPdf(
  id: number,
  filename: string,
): Promise<void> {
  const blob = await apiGetBlob(`/documents/${id}/pdf`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
