"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MonthSelector from "@/components/MonthSelector";
import CategoryBar from "@/components/CategoryBar";
import LineChart from "@/components/LineChart";
import { Toast, useToast } from "@/components/Toast";
import { getExpensesByMonth, getExpensesByYear } from "@/actions/expenses";
import { getIncomeByYear } from "@/actions/income";
import type { OtherExpenseItem } from "@/lib/schema";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatCurrency(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CATEGORY_COLORS: Record<string, string> = {
  Breakfast: "bg-amber-500",
  Lunch: "bg-orange-500",
  Dinner: "bg-rose-500",
  Transport: "bg-sky-500",
  "Utilities & Bills": "bg-violet-500",
  "Groceries & Snacks": "bg-lime-500",
  Health: "bg-pink-500",
  Entertainment: "bg-teal-500",
  Other: "bg-slate-400",
};

type ExpenseRow = {
  id: string;
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  otherExpenses: OtherExpenseItem[];
  createdAt: Date;
  updatedAt: Date;
};

type YearIncomeRow = {
  month: string;
  salary: number;
  freelance: number;
  other: number;
};

type ChartPoint = {
  label: string;
  values: Record<string, number>;
};

function getRowTotal(row: ExpenseRow) {
  return (
    row.breakfast +
    row.lunch +
    row.dinner +
    row.otherExpenses.reduce((s, e) => s + e.amount, 0)
  );
}

function getCategoryTotals(rows: ExpenseRow[]) {
  const totals: Record<string, number> = {
    Breakfast: 0,
    Lunch: 0,
    Dinner: 0,
    Transport: 0,
    "Utilities & Bills": 0,
    "Groceries & Snacks": 0,
    Health: 0,
    Entertainment: 0,
    Other: 0,
  };
  for (const row of rows) {
    totals["Breakfast"] += row.breakfast;
    totals["Lunch"] += row.lunch;
    totals["Dinner"] += row.dinner;
    for (const item of row.otherExpenses) {
      if (item.category in totals) totals[item.category] += item.amount;
      else totals["Other"] += item.amount;
    }
  }
  return totals;
}

function getWeeks(month: string, rows: ExpenseRow[]) {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const rowMap = new Map(rows.map((r) => [r.date, r]));
  const weeks: { label: string; total: number }[] = [];
  let weekStart = 1;
  while (weekStart <= daysInMonth) {
    const weekEnd = Math.min(weekStart + 6, daysInMonth);
    let total = 0;
    for (let d = weekStart; d <= weekEnd; d++) {
      const ds = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const row = rowMap.get(ds);
      if (row) total += getRowTotal(row);
    }
    weeks.push({ label: `Week ${weeks.length + 1}  (${weekStart}–${weekEnd})`, total });
    weekStart += 7;
  }
  return weeks;
}

function buildMonthSpendSeries(month: string, rows: ExpenseRow[]): ChartPoint[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const totalsByDate = new Map(rows.map((row) => [row.date, getRowTotal(row)]));
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateKey = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { label: String(day), values: { spent: totalsByDate.get(dateKey) ?? 0 } };
  });
}

function buildYearSpendSeries(year: string, rows: ExpenseRow[]): ChartPoint[] {
  const totals = Array.from({ length: 12 }, () => 0);
  for (const row of rows) {
    const idx = Number(row.date.slice(5, 7)) - 1;
    if (idx >= 0 && idx < 12) totals[idx] += getRowTotal(row);
  }
  return MONTH_LABELS.map((label, i) => ({ label, values: { spent: totals[i] } }));
}

function buildYearComparisonSeries(rows: ExpenseRow[], incomes: YearIncomeRow[]): ChartPoint[] {
  const expTotals = Array.from({ length: 12 }, () => 0);
  const incTotals = Array.from({ length: 12 }, () => 0);
  for (const row of rows) {
    const idx = Number(row.date.slice(5, 7)) - 1;
    if (idx >= 0 && idx < 12) expTotals[idx] += getRowTotal(row);
  }
  for (const row of incomes) {
    const idx = Number(row.month.slice(5, 7)) - 1;
    if (idx >= 0 && idx < 12) incTotals[idx] += row.salary + row.freelance + row.other;
  }
  return MONTH_LABELS.map((label, i) => ({
    label,
    values: { cost: expTotals[i], income: incTotals[i] },
  }));
}

// ─── component ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthFromUrl = searchParams.get("month") ?? getCurrentMonth();
  const [month, setMonth] = useState(monthFromUrl);

  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [yearExpenseRows, setYearExpenseRows] = useState<ExpenseRow[]>([]);
  const [yearIncomeRows, setYearIncomeRows] = useState<YearIncomeRow[]>([]);
  const [trendRange, setTrendRange] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    setMonth(monthFromUrl);
  }, [monthFromUrl]);

  const loadData = useCallback(
    async (m: string) => {
      setLoading(true);
      try {
        const year = m.slice(0, 4);
        const [expRows, yearExpenses, yearIncomes] = await Promise.all([
          getExpensesByMonth(m),
          getExpensesByYear(year),
          getIncomeByYear(year),
        ]);
        setExpenseRows(expRows as ExpenseRow[]);
        setYearExpenseRows(yearExpenses as ExpenseRow[]);
        setYearIncomeRows(yearIncomes as YearIncomeRow[]);
      } catch {
        showToast("Failed to load analytics data.", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadData(month);
  }, [month, loadData]);

  const handleMonthChange = (next: string) => {
    setMonth(next);
    router.replace(`/analytics?month=${next}`, { scroll: false });
  };

  const selectedYear = month.slice(0, 4);
  const categoryTotals = getCategoryTotals(expenseRows);
  const totalSpent = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
  const weeks = getWeeks(month, expenseRows);
  const spendTrendData =
    trendRange === "month"
      ? buildMonthSpendSeries(month, expenseRows)
      : buildYearSpendSeries(selectedYear, yearExpenseRows);
  const yearComparisonData = buildYearComparisonSeries(yearExpenseRows, yearIncomeRows);

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Spending trends, category breakdown and weekly patterns.
            </p>
          </div>
          <MonthSelector month={month} onChange={handleMonthChange} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <>
            {/* ── Total spent summary */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Spent</p>
                <p className="text-2xl font-bold text-rose-400">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-slate-500">
                  {expenseRows.length} day{expenseRows.length !== 1 ? "s" : ""} with expenses logged
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Daily Average</p>
                <p className="text-2xl font-bold text-brand-300">
                  {formatCurrency(expenseRows.length > 0 ? Math.round(totalSpent / expenseRows.length) : 0)}
                </p>
                <p className="text-xs text-slate-500">
                  per logged day in {new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* ── Spending Trend chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Spending Trend
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {trendRange === "month"
                      ? "Daily spending across the selected month"
                      : `Monthly spending across ${selectedYear}`}
                  </p>
                </div>
                <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
                  {(["month", "year"] as const).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setTrendRange(range)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        trendRange === range
                          ? "bg-brand-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {range === "month" ? "Month" : "Year"}
                    </button>
                  ))}
                </div>
              </div>

              <LineChart
                data={spendTrendData}
                series={[{ key: "spent", label: trendRange === "month" ? "Daily spent" : "Monthly spent", color: "#38bdf8" }]}
                emptyMessage="No spending data found for this period."
              />
            </div>

            {/* ── Income vs Cost chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Monthly Income vs Cost
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Monthly income and spending compared across {selectedYear}.
                </p>
              </div>
              <LineChart
                data={yearComparisonData}
                series={[
                  { key: "cost", label: "Cost", color: "#fb7185" },
                  { key: "income", label: "Income", color: "#34d399" },
                ]}
                emptyMessage="No yearly totals found yet."
              />
            </div>

            {/* ── Category breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Category Breakdown
              </h2>
              {totalSpent === 0 ? (
                <p className="text-sm text-slate-600 text-center py-4">No expenses this month</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(categoryTotals)
                    .filter(([, amount]) => amount > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amount]) => (
                      <CategoryBar
                        key={cat}
                        label={cat}
                        amount={amount}
                        total={totalSpent}
                        color={CATEGORY_COLORS[cat] ?? "bg-slate-400"}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* ── Weekly breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Weekly Breakdown
              </h2>
              <div className="space-y-2">
                {weeks.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-3"
                  >
                    <span className="text-sm text-slate-400">{w.label}</span>
                    <span
                      className={`text-sm font-semibold ${
                        w.total > 0 ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {w.total > 0 ? formatCurrency(w.total) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
