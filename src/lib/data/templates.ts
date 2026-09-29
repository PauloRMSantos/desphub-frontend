import type {
  AiFromDescriptionDTO,
  AiFromTextDTO,
  CreateTemplateDTO,
  Template,
  TemplateCategory,
  TemplateSummary,
  VariableCatalogEntry,
} from "@/types";
import { apiGet, apiSend } from "./http";

export function getTemplates(
  category?: TemplateCategory,
): Promise<TemplateSummary[]> {
  return apiGet<TemplateSummary[]>("/templates", { category });
}

export function getTemplate(id: number): Promise<Template> {
  return apiGet<Template>(`/templates/${id}`);
}

export function createTemplate(data: CreateTemplateDTO) {
  return apiSend<Template>("POST", "/templates", data);
}

export function updateTemplate(id: number, data: CreateTemplateDTO) {
  return apiSend<Template>("PUT", `/templates/${id}`, data);
}

export function deleteTemplate(id: number) {
  return apiSend<void>("DELETE", `/templates/${id}`);
}

export function getVariableCatalog(): Promise<VariableCatalogEntry[]> {
  return apiGet<VariableCatalogEntry[]>("/templates/variable-catalog");
}

export function aiTemplateFromText(data: AiFromTextDTO) {
  return apiSend<CreateTemplateDTO>("POST", "/templates/ai/from-text", data);
}

export function aiTemplateFromDescription(data: AiFromDescriptionDTO) {
  return apiSend<CreateTemplateDTO>(
    "POST",
    "/templates/ai/from-description",
    data,
  );
}
