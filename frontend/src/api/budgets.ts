import { apiClient } from "./client";
import type { Budget, BudgetStatus } from "../types";

export async function fetchBudgets(): Promise<Budget[]> {
  const { data } = await apiClient.get("/budgets/");
  return data;
}

/** Budgets enriched with this month's spend — powers the progress bars. */
export async function fetchBudgetStatus(): Promise<BudgetStatus[]> {
  const { data } = await apiClient.get("/budgets/status");
  return data;
}

export async function createBudget(category_id: number, monthly_limit: number): Promise<Budget> {
  const { data } = await apiClient.post("/budgets/", { category_id, monthly_limit });
  return data;
}

export async function deleteBudget(id: number): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
