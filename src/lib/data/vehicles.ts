import type {
  CreateVehicleDTO,
  NfeImportResponse,
  UpdateVehicleDTO,
  QueryState,
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
  state?: QueryState,
): Promise<VehicleQueryResponse> {
  return apiGet<VehicleQueryResponse>("/vehicles/query", {
    plate,
    renavam,
    state,
  });
}

export async function queryVehicleSc(
  plate: string | undefined,
  renavam: string | undefined,
  payload: unknown,
): Promise<VehicleQueryResponse> {
  const res = await apiSend<VehicleQueryResponse>("POST", "/vehicles/query", {
    plate: plate || undefined,
    renavam: renavam || undefined,
    state: "SC",
    payload,
  });
  return res as VehicleQueryResponse;
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
