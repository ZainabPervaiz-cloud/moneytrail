import { apiClient } from "./client";
import type { CategorySpending, MonthlySummary, YearlySummary } from "../types";

/** Income/expense/balance for one month — defaults to the current month
 *  when year/month are omitted. */
export async function fetchMonthlySummary(year?: number, month?: number): Promise<MonthlySummary> {
  const { data } = await apiClient.get("/analytics/summary", { params: { year, month } });
  return data;
}

export async function fetchSpendingByCategory(year?: number, month?: number): Promise<CategorySpending[]> {
  const { data } = await apiClient.get("/analytics/by-category", { params: { year, month } });
  return data;
}

/** The auto-generated "Your X spending increased Y% vs last month" sentence. */
export async function fetchSpendingInsight(year?: number, month?: number): Promise<{ message: string }> {
  const { data } = await apiClient.get("/analytics/insight", { params: { year, month } });
  return data;
}

/** Month-by-month income/expense/net for a whole year, plus annual totals. */
export async function fetchYearlySummary(year?: number): Promise<YearlySummary> {
  const { data } = await apiClient.get("/analytics/yearly", { params: { year } });
  return data;
}
