/**
 * Home screen: a chosen month's balance at a glance, the auto-generated
 * spending insight, and a breakdown of expenses by category. Defaults
 * to the current month, but a prev/next picker lets the user page back
 * through history (e.g. "what did August look like?").
 */

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { fetchMonthlySummary, fetchSpendingByCategory, fetchSpendingInsight } from "../api/analytics";
import { useAuth } from "../context/AuthContext";
import type { CategorySpending, MonthlySummary } from "../types";

// A small, colorblind-considered palette cycled across pie slices —
// enough distinct hues for a typical household's category count.
const CHART_COLORS = ["#0f766e", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#84cc16"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();

  // The month currently being viewed — starts on "this month" but is
  // independent of the real calendar date once the user pages back.
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // JS months are 0-indexed; ours are 1-12

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [byCategory, setByCategory] = useState<CategorySpending[]>([]);
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Load all three dashboard data sources in parallel rather than
    // one-after-another, so the page appears as fast as the slowest
    // single call instead of the sum of all three.
    Promise.all([
      fetchMonthlySummary(year, month),
      fetchSpendingByCategory(year, month),
      fetchSpendingInsight(year, month),
    ])
      .then(([summaryRes, byCategoryRes, insightRes]) => {
        setSummary(summaryRes);
        setByCategory(byCategoryRes);
        setInsight(insightRes.message);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function goToPreviousMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    // Never let the picker page into the future — there's nothing to show there.
    if (isCurrentMonth) return;
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  // First-name-only greeting — "Hi, Zainab 👋" rather than the full
  // legal name, which stays reserved for account/profile contexts.
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        {firstName && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            Hi, {firstName} 👋
          </p>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {isCurrentMonth ? "This Month" : `${MONTH_NAMES[month - 1]} ${year}`}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPreviousMonth}
              aria-label="Previous month"
              className="w-8 h-8 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ‹
            </button>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              aria-label="Next month"
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
          {/* Balance / income / expense summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="Balance" value={summary?.balance ?? 0} accent="text-neutral-900 dark:text-neutral-100" />
            <SummaryCard label="Income" value={summary?.income ?? 0} accent="text-green-600" />
            <SummaryCard label="Expense" value={summary?.expense ?? 0} accent="text-red-500" />
          </div>

          {/* Savings-health banner — reacts to the actual balance rather
              than being decorative, same red/amber/green status language
              as the budget progress bars use. */}
          <SavingsHealthBanner summary={summary} />

          {/* Auto-generated insight banner */}
          {insight && (
            <div className="bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 rounded-xl p-4 text-sm text-teal-900 dark:text-teal-100">
              💡 {insight}
            </div>
          )}

          {/* Spending-by-category pie chart */}
          <div>
            <h2 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              Spending by Category
            </h2>
            {byCategory.length === 0 ? (
              <p className="text-sm text-neutral-500">No expenses logged for this month.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="total"
                      nameKey="category"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {byCategory.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => Number(value ?? 0).toFixed(2)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <Link
            to="/yearly"
            className="text-center text-sm text-teal-600 dark:text-teal-400 font-medium"
          >
            📈 View yearly trends & annual savings →
          </Link>
        </>
      )}

      <Link
        to="/about"
        className="text-center text-xs text-neutral-400 dark:text-neutral-500 hover:text-teal-600 dark:hover:text-teal-400"
      >
        ℹ️ About this app
      </Link>
    </div>
  );
}

/**
 * Reacts to the viewed month's actual numbers — three states, same
 * red/amber/green vocabulary as the budget bars, so "over budget" and
 * "overspending overall" read as the same kind of warning everywhere
 * in the app:
 *   - critical (red):  spent more than earned that month
 *   - warning (amber):  saved less than 10% of income
 *   - good (green):     saved a healthy share of income
 * Shows nothing if there's no income or expense logged at all — a
 * status message about zero data isn't useful.
 */
function SavingsHealthBanner({ summary }: { summary: MonthlySummary | null }) {
  if (!summary || (summary.income === 0 && summary.expense === 0)) return null;

  const savingsRate = summary.income > 0 ? (summary.balance / summary.income) * 100 : -100;

  let level: "critical" | "warning" | "good";
  let message: string;

  if (summary.balance < 0) {
    level = "critical";
    message = `⚠️ Spent ${Math.abs(summary.balance).toFixed(0)} more than earned that month.`;
  } else if (savingsRate < 10) {
    level = "warning";
    message = `Just about broke even — only ${savingsRate.toFixed(0)}% saved.`;
  } else {
    level = "good";
    message = `🎉 Saved ${savingsRate.toFixed(0)}% of income that month.`;
  }

  const styles = {
    critical: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
    warning: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100",
    good: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
  }[level];

  return <div className={`border rounded-xl p-4 text-sm ${styles}`}>{message}</div>;
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-center">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`text-lg font-semibold ${accent}`}>{value.toFixed(0)}</p>
    </div>
  );
}
