/**
 * Budget management: set a monthly limit per category and see a
 * progress bar showing how much of it has been spent so far this month.
 */

import { useEffect, useState, type FormEvent } from "react";
import { createBudget, deleteBudget, fetchBudgetStatus } from "../api/budgets";
import { fetchCategories } from "../api/categories";
import type { BudgetStatus, Category } from "../types";

export function BudgetsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [limit, setLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    const [cats, statuses] = await Promise.all([fetchCategories(), fetchBudgetStatus()]);
    setCategories(cats.filter((c) => c.type === "expense")); // budgets only make sense for expenses
    setBudgets(statuses);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!categoryId || !limit) return;

    setSubmitting(true);
    try {
      await createBudget(Number(categoryId), Number(limit));
      setLimit("");
      setCategoryId("");
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteBudget(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }

  if (loading) {
    return <p className="text-center text-neutral-500 mt-10">Loading budgets…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Budgets</h1>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-3 py-2"
        >
          <option value="" disabled>
            Select category…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Monthly limit"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-3 py-2"
        />

        <button
          type="submit"
          disabled={submitting}
          className="bg-teal-600 text-white rounded-lg py-2 font-medium disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Set budget"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {budgets.length === 0 && (
          <p className="text-sm text-neutral-500 text-center">No budgets set yet.</p>
        )}
        {budgets.map((budget) => {
          const category = categories.find((c) => c.id === budget.category_id);
          // Over-budget bars turn red instead of the usual teal, and cap
          // visually at 100% even if percent_used exceeds it.
          const isOverBudget = budget.percent_used >= 100;
          return (
            <div
              key={budget.id}
              className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {category ? `${category.icon} ${category.name}` : "Category"}
                </span>
                <button
                  onClick={() => handleDelete(budget.id)}
                  aria-label="Delete budget"
                  className="text-neutral-400 hover:text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isOverBudget ? "bg-red-500" : "bg-teal-600"}`}
                  style={{ width: `${Math.min(budget.percent_used, 100)}%` }}
                />
              </div>

              <p className="text-xs text-neutral-500 mt-1">
                {budget.spent.toFixed(2)} / {budget.monthly_limit.toFixed(2)} spent (
                {budget.percent_used.toFixed(0)}%)
                {isOverBudget && <span className="text-red-500"> — over budget!</span>}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
