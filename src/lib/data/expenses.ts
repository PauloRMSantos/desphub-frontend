import type {
  CreateExpenseItemDTO,
  ExpenseItem,
  UpdateExpenseItemDTO,
} from "@/types";
import { apiGet, apiSend } from "./http";

export function getExpenses(params?: {
  from?: string;
  to?: string;
}): Promise<ExpenseItem[]> {
  return apiGet<ExpenseItem[]>("/expenses", params);
}

export function createExpense(data: CreateExpenseItemDTO) {
  return apiSend<ExpenseItem>("POST", "/expenses", data);
}

export function updateExpense(id: number, data: UpdateExpenseItemDTO) {
  return apiSend<ExpenseItem>("PUT", `/expenses/${id}`, data);
}

export function deleteExpense(id: number) {
  return apiSend<void>("DELETE", `/expenses/${id}`);
}
