import type {
  CreateOfficeDTO,
  CreateOfficeUserDTO,
  Office,
  OfficeUser,
  Permission,
} from "@/types";
import { apiGet, apiSend } from "./http";

export function getOffices(): Promise<Office[]> {
  return apiGet<Office[]>("/offices");
}

export function getOffice(id: number): Promise<Office> {
  return apiGet<Office>(`/offices/${id}`);
}

export function createOffice(data: CreateOfficeDTO) {
  return apiSend<Office>("POST", "/offices", data);
}

export function deleteOffice(id: number) {
  return apiSend<void>("DELETE", `/offices/${id}`);
}

export function getOfficeUsers(officeId: number): Promise<OfficeUser[]> {
  return apiGet<OfficeUser[]>(`/offices/${officeId}/users`);
}

export function createOfficeUser(officeId: number, data: CreateOfficeUserDTO) {
  return apiSend<OfficeUser>("POST", `/offices/${officeId}/users`, data);
}

export function updateOfficeUserPermissions(
  officeId: number,
  userId: number,
  permissions: Permission[],
) {
  return apiSend<OfficeUser>(
    "PUT",
    `/offices/${officeId}/users/${userId}/permissions`,
    { permissions },
  );
}

export function setOfficeUserActive(
  officeId: number,
  userId: number,
  active: boolean,
) {
  return apiSend<OfficeUser>(
    "PATCH",
    `/offices/${officeId}/users/${userId}/active`,
    { active },
  );
}

export function deleteOfficeUser(officeId: number, userId: number) {
  return apiSend<void>("DELETE", `/offices/${officeId}/users/${userId}`);
}
