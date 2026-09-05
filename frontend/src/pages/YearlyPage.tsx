/**
 * Yearly overview: income vs. expense for every month of a chosen year,
 * plus the annual totals — answers "how much did I actually save or
 * lose this year?" instead of only ever showing one month at a time.
 */

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { fetchYearlySummary } from "../api/analytics";
import type { YearlySummary } from "../types";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function YearlyPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<YearlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchYearlySummary(year)
      .then(setData)
      .finally(() => setLoading(false));
  }, [year]);

  // Reshape for Recharts: one row per month with a short label and both
  // series, so income/expense render as paired bars per month.
  const chartData =
    data?.months.map((m) => ({
      name: MONTH_ABBR[m.month - 1],
      Income: m.income,
      Expense: m.expense,
    })) ?? [];

  const netLabel = (data?.total_net ?? 0) >= 0 ? "Saved" : "Lost";
  const netColor = (data?.total_net ?? 0) >= 0 ? "text-green-600" : "text-red-500";
  const savingsRate =
    data && data.total_income > 0 ? (data.total_net / data.total_income) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/" className="text-sm text-teal-600 dark:text-teal-400">
          ← Back to Dashboard
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {year} Overview
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              aria-label="Previous year"
              className="w-8 h-8 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ‹
            </button>
            <button
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= currentYear}
              aria-label="Next year"
              className="w-8 h-8 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-neutral-500 mt-10">Loading…</p>
      ) : (
        <>
          {/* Annual totals */}
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Income</p>
              <p className="text-lg font-semibold text-green-600">{(data?.total_income ?? 0).toFixed(0)}</p>
            </div>
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Expense</p>
              <p className="text-lg font-semibold text-red-500">{(data?.total_expense ?? 0).toFixed(0)}</p>
            </div>
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{netLabel}</p>
              <p className={`text-lg font-semibold ${netColor}`}>
                {Math.abs(data?.total_net ?? 0).toFixed(0)}
              </p>
            </div>
          </div>

          {data && (data.total_income > 0 || data.total_expense > 0) && (
            <div
              className={`border rounded-xl p-4 text-sm ${
                savingsRate >= 0
                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100"
                  : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100"
              }`}
            >
              {savingsRate >= 0
                ? `🎉 You saved ${savingsRate.toFixed(0)}% of your income in ${year}.`
                : `⚠️ You spent ${Math.abs(savingsRate).toFixed(0)}% more than you earned in ${year}.`}
            </div>
          )}

          {/* Income vs. expense per month */}
          <div>
            <h2 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              Monthly Trend
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => Number(value ?? 0).toFixed(2)} />
                  <Bar dataKey="Income" fill="#16a34a" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
