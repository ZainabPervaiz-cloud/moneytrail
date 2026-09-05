/**
 * Transaction history + a quick "add transaction" form. Categories are
 * loaded once on mount; if the user has none yet (brand-new account),
 * a couple of sensible defaults are offered inline instead of forcing
 * a trip to a separate "manage categories" screen first.
 */

import { useEffect, useState, type FormEvent } from "react";
import { fetchCategories } from "../api/categories";
import { createTransaction, deleteTransaction, fetchTransactions } from "../api/transactions";
import type { Category, Transaction, TransactionType } from "../types";

export function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Add-transaction form state.
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    const [cats, txs] = await Promise.all([fetchCategories(), fetchTransactions()]);
    setCategories(cats);
    setTransactions(txs);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const categoriesForType = categories.filter((c) => c.type === type);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!categoryId || !amount) return;

    setSubmitting(true);
    try {
      await createTransaction({
        category_id: Number(categoryId),
        amount: Number(amount),
        type,
        note: note || undefined,
      });
      setAmount("");
      setNote("");
      await loadData(); // refresh the list + (implicitly) dashboard totals next visit
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return <p className="text-center text-neutral-500 mt-10">Loading transactions…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Transactions
      </h1>

      {/* Add transaction form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
        <div className="flex gap-2">
          {(["expense", "income"] as TransactionType[]).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => {
                setType(t);
                setCategoryId("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${
                type === t
                  ? "bg-teal-600 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-3 py-2"
        >
          <option value="" disabled>
            Select category…
          </option>
          {categoriesForType.map((c) => (
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
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-3 py-2"
        />

        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-3 py-2"
        />

        <button
          type="submit"
          disabled={submitting}
          className="bg-teal-600 text-white rounded-lg py-2 font-medium disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add transaction"}
        </button>
      </form>

      {/* Transaction list */}
      <div className="flex flex-col gap-2">
        {transactions.length === 0 && (
          <p className="text-sm text-neutral-500 text-center">No transactions yet.</p>
        )}
        {transactions.map((tx) => {
          const category = categories.find((c) => c.id === tx.category_id);
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3"
            >
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {category ? `${category.icon} ${category.name}` : "Uncategorized"}
                </p>
                {tx.note && <p className="text-xs text-neutral-500">{tx.note}</p>}
                <p className="text-xs text-neutral-400">
                  {new Date(tx.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={tx.type === "income" ? "text-green-600" : "text-red-500"}>
                  {tx.type === "income" ? "+" : "-"}
                  {tx.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => handleDelete(tx.id)}
                  aria-label="Delete transaction"
                  className="text-neutral-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
