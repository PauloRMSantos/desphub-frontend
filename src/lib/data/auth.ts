import type { AuthUser, LoginRequest, LoginResponse } from "@/types";
import { apiGet, apiSend, setToken } from "./http";

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiSend<LoginResponse>("POST", "/auth/login", data);
  if (res?.token) setToken(res.token);
  return res as LoginResponse;
}

export function getMe(): Promise<AuthUser> {
  return apiGet<AuthUser>("/auth/me");
}

export function logout(): void {
  setToken(null);
}
