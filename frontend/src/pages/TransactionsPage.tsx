/**
 * Transaction history, a quick "add transaction" form, and a search bar
 * (date range + amount range) — answers "in October, where did I spend
 * around 1000?" instead of only ever showing everything at once.
 *
 * Categories are loaded once on mount; if the user has none yet
 * (brand-new account), the backend auto-seeds sensible defaults the
 * first time they're fetched, so the dropdown is never empty.
 */

import { useEffect, useState, type FormEvent } from "react";
import { fetchCategories } from "../api/categories";
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  type TransactionFilters,
} from "../api/transactions";
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

  // Search/filter form state — kept separate from the add-form's own
  // "amount" field above. Empty string means "no filter on this field."
  const [showSearch, setShowSearch] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const categoriesForType = categories.filter((c) => c.type === type);

  // The catch-all "Other" / "Other Income" category groups anything that
  // doesn't fit the presets for budgeting/analytics purposes — but on its
  // own it's meaningless in the transaction list, so once it's selected
  // the note becomes "what is this, specifically?" instead of an
  // optional aside (e.g. picking "Other" and noting "Umrah").
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isOtherCategory = selectedCategory?.name.startsWith("Other") ?? false;

  /** Builds a TransactionFilters object from whatever search fields are
   *  currently filled in, omitting the empty ones entirely. */
  function currentFilters(): TransactionFilters {
    const filters: TransactionFilters = {};
    if (startDate) filters.start_date = new Date(startDate).toISOString();
    if (endDate) filters.end_date = new Date(endDate + "T23:59:59").toISOString();
    if (minAmount) filters.min_amount = Number(minAmount);
    if (maxAmount) filters.max_amount = Number(maxAmount);
    return filters;
  }

  async function loadTransactions(filters: TransactionFilters = {}) {
    setTransactions(await fetchTransactions(filters));
  }

  useEffect(() => {
    Promise.all([fetchCategories(), fetchTransactions()]).then(([cats, txs]) => {
      setCategories(cats);
      setTransactions(txs);
      setLoading(false);
    });
  }, []);

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
      await loadTransactions(currentFilters()); // respect an active search after adding
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    loadTransactions(currentFilters());
  }

  function handleClearSearch() {
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    loadTransactions();
  }

  const hasActiveFilters = Boolean(startDate || endDate || minAmount || maxAmount);

  if (loading) {
    return <p className="text-center text-neutral-500 mt-10">Loading transactions…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Transactions
        </h1>
        <button
          onClick={() => setShowSearch((s) => !s)}
          className={`text-sm font-medium ${
            hasActiveFilters ? "text-teal-600 dark:text-teal-400" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          🔍 Search
        </button>
      </div>

      {/* Search / filter bar — collapsed by default to keep the page
          focused on "add + recent transactions" for the common case. */}
      {showSearch && (
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              From date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              To date
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              Min amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              Max amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="Any"
                className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-teal-600 text-white rounded-lg py-2 text-sm font-medium"
            >
              Apply filters
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 rounded-lg text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      )}

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
          required={isOtherCategory}
          placeholder={isOtherCategory ? "What's this for? e.g. Umrah, Gift, Repair" : "Note (optional)"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`border bg-transparent rounded-lg px-3 py-2 ${
            isOtherCategory
              ? "border-teal-600 dark:border-teal-500"
              : "border-neutral-300 dark:border-neutral-700"
          }`}
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
          <p className="text-sm text-neutral-500 text-center">
            {hasActiveFilters ? "No transactions match this search." : "No transactions yet."}
          </p>
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
