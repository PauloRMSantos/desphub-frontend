import type { CreateServiceDTO, Service, UpdateServiceDTO } from "@/types";
import { apiGet, apiSend } from "./http";

export function getServices(): Promise<Service[]> {
  return apiGet<Service[]>("/services");
}

export function getService(id: number): Promise<Service> {
  return apiGet<Service>(`/services/${id}`);
}

export function createService(data: CreateServiceDTO) {
  return apiSend<Service>("POST", "/services", data);
}

export function updateService(id: number, data: UpdateServiceDTO) {
  return apiSend<Service>("PUT", `/services/${id}`, data);
}

export function deleteService(id: number) {
  return apiSend<void>("DELETE", `/services/${id}`);
}
