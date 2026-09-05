/**
 * Home screen: this month's balance at a glance, the auto-generated
 * spending insight, and a breakdown of expenses by category.
 */

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fetchMonthlySummary, fetchSpendingByCategory, fetchSpendingInsight } from "../api/analytics";
import { useAuth } from "../context/AuthContext";
import type { CategorySpending, MonthlySummary } from "../types";

// A small, colorblind-considered palette cycled across pie slices —
// enough distinct hues for a typical household's category count.
const CHART_COLORS = ["#0f766e", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#84cc16"];

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [byCategory, setByCategory] = useState<CategorySpending[]>([]);
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load all three dashboard data sources in parallel rather than
    // one-after-another, so the page appears as fast as the slowest
    // single call instead of the sum of all three.
    Promise.all([fetchMonthlySummary(), fetchSpendingByCategory(), fetchSpendingInsight()])
      .then(([summaryRes, byCategoryRes, insightRes]) => {
        setSummary(summaryRes);
        setByCategory(byCategoryRes);
        setInsight(insightRes.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center text-neutral-500 mt-10">Loading dashboard…</p>;
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
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          This Month
        </h1>
      </div>

      {/* Balance / income / expense summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Balance" value={summary?.balance ?? 0} accent="text-neutral-900 dark:text-neutral-100" />
        <SummaryCard label="Income" value={summary?.income ?? 0} accent="text-green-600" />
        <SummaryCard label="Expense" value={summary?.expense ?? 0} accent="text-red-500" />
      </div>

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
          <p className="text-sm text-neutral-500">No expenses logged yet this month.</p>
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
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-center">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`text-lg font-semibold ${accent}`}>{value.toFixed(0)}</p>
    </div>
  );
}
