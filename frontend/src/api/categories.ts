import { apiClient } from "./client";
import type { Category, TransactionType } from "../types";

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get("/categories/");
  return data;
}

export async function createCategory(
  name: string,
  type: TransactionType,
  icon = "💰",
): Promise<Category> {
  const { data } = await apiClient.post("/categories/", { name, type, icon });
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
