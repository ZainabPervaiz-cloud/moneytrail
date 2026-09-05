import { apiClient } from "./client";
import type { CategorySpending, MonthlySummary } from "../types";

export async function fetchMonthlySummary(): Promise<MonthlySummary> {
  const { data } = await apiClient.get("/analytics/summary");
  return data;
}

export async function fetchSpendingByCategory(): Promise<CategorySpending[]> {
  const { data } = await apiClient.get("/analytics/by-category");
  return data;
}

/** The auto-generated "Your X spending increased Y% vs last month" sentence. */
export async function fetchSpendingInsight(): Promise<{ message: string }> {
  const { data } = await apiClient.get("/analytics/insight");
  return data;
}
