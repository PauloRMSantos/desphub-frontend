import type { Budget, CreateBudgetDTO, UpdateBudgetDTO } from "@/types";
import { apiGet, apiSend } from "./http";

export function getBudgets(): Promise<Budget[]> {
  return apiGet<Budget[]>("/budgets");
}

export function getBudget(id: number): Promise<Budget> {
  return apiGet<Budget>(`/budgets/${id}`);
}

export function createBudget(data: CreateBudgetDTO) {
  return apiSend<Budget>("POST", "/budgets", data);
}

export function updateBudget(id: number, data: UpdateBudgetDTO) {
  return apiSend<Budget>("PUT", `/budgets/${id}`, data);
}

export function deleteBudget(id: number) {
  return apiSend<void>("DELETE", `/budgets/${id}`);
}
