import type {
  CreateVehicleDTO,
  NfeImportResponse,
  UpdateVehicleDTO,
  Vehicle,
  VehicleDocumentParseResponse,
  VehicleQueryResponse,
} from "@/types";
import { apiGet, apiSend, apiUpload } from "./http";

export function getVehicles(): Promise<Vehicle[]> {
  return apiGet<Vehicle[]>("/vehicles");
}

export function getVehicle(id: number): Promise<Vehicle> {
  return apiGet<Vehicle>(`/vehicles/${id}`);
}

export function createVehicle(data: CreateVehicleDTO) {
  return apiSend<Vehicle>("POST", "/vehicles", data);
}

export function updateVehicle(id: number, data: UpdateVehicleDTO) {
  return apiSend<Vehicle>("PUT", `/vehicles/${id}`, data);
}

export function deleteVehicle(id: number) {
  return apiSend<void>("DELETE", `/vehicles/${id}`);
}

export function queryVehicle(
  plate?: string,
  renavam?: string,
): Promise<VehicleQueryResponse> {
  return apiGet<VehicleQueryResponse>("/vehicles/query", { plate, renavam });
}

export function importNfeByPdf(file: File): Promise<NfeImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<NfeImportResponse>("/vehicles/nfe/pdf", formData);
}

export function parseVehicleDocument(
  file: File,
): Promise<VehicleDocumentParseResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<VehicleDocumentParseResponse>(
    "/vehicles/parse-document",
    formData,
  );
}
