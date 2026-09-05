/**
 * Shared TypeScript types mirroring the backend's Pydantic schemas
 * (see backend/app/schemas.py). Keeping them in one file means every
 * component and API call agrees on the same shape.
 */

export type TransactionType = "income" | "expense";

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  icon: string;
  is_default: boolean;
}

export interface Transaction {
  id: number;
  category_id: number;
  amount: number;
  type: TransactionType;
  note: string | null;
  date: string; // ISO datetime string
}

export interface Budget {
  id: number;
  category_id: number;
  monthly_limit: number;
}

export interface BudgetStatus extends Budget {
  spent: number;
  remaining: number;
  percent_used: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
}

export interface CategorySpending {
  category: string;
  icon: string;
  total: number;
}

export interface MonthPoint {
  month: number; // 1-12
  income: number;
  expense: number;
  net: number;
}

export interface YearlySummary {
  year: number;
  months: MonthPoint[];
  total_income: number;
  total_expense: number;
  total_net: number;
}
