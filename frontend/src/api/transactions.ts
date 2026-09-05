import { apiClient } from "./client";
import type { Transaction, TransactionType } from "../types";

export interface TransactionFilters {
  category_id?: number;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

export async function fetchTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const { data } = await apiClient.get("/transactions/", { params: filters });
  return data;
}

export interface NewTransaction {
  category_id: number;
  amount: number;
  type: TransactionType;
  note?: string;
  date?: string;
}

export async function createTransaction(tx: NewTransaction): Promise<Transaction> {
  const { data } = await apiClient.post("/transactions/", tx);
  return data;
}

export async function updateTransaction(id: number, tx: NewTransaction): Promise<Transaction> {
  const { data } = await apiClient.put(`/transactions/${id}`, tx);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
