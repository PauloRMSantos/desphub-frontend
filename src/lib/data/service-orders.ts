import type {
  CreateServiceOrderDTO,
  ServiceOrder,
  UpdateServiceOrderDTO,
} from "@/types";
import { apiGet, apiSend } from "./http";

export function getServiceOrders(): Promise<ServiceOrder[]> {
  return apiGet<ServiceOrder[]>("/service-orders");
}

export function getServiceOrder(id: number): Promise<ServiceOrder> {
  return apiGet<ServiceOrder>(`/service-orders/${id}`);
}

export function createServiceOrder(data: CreateServiceOrderDTO) {
  return apiSend<ServiceOrder>("POST", "/service-orders", data);
}

export function updateServiceOrder(id: number, data: UpdateServiceOrderDTO) {
  return apiSend<ServiceOrder>("PUT", `/service-orders/${id}`, data);
}

export function deleteServiceOrder(id: number) {
  return apiSend<void>("DELETE", `/service-orders/${id}`);
}
