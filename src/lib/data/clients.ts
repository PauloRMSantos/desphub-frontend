import type { Client, CreateClientDTO, UpdateClientDTO } from "@/types";
import { apiGet, apiSend } from "./http";

export function getClients(): Promise<Client[]> {
  return apiGet<Client[]>("/clients");
}

export function getClient(id: number): Promise<Client> {
  return apiGet<Client>(`/clients/${id}`);
}

export function createClient(data: CreateClientDTO) {
  return apiSend<Client>("POST", "/clients", data);
}

export function updateClient(id: number, data: UpdateClientDTO) {
  return apiSend<Client>("PUT", `/clients/${id}`, data);
}

export function deleteClient(id: number) {
  return apiSend<void>("DELETE", `/clients/${id}`);
}
