"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MonthSelector from "@/components/MonthSelector";
import CategoryBar from "@/components/CategoryBar";
import { Toast, useToast } from "@/components/Toast";
import { getExpensesByMonth } from "@/actions/expenses";
import { getIncomeByMonth, upsertIncome } from "@/actions/income";
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

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

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

type IncomeRow = {
  salary: number;
  freelance: number;
  other: number;
};

// Category colors
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

// ─── weekly breakdown ─────────────────────────────────────────────────────────

function getWeeks(
  month: string,
  rows: ExpenseRow[]
): { label: string; total: number }[] {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const rowMap = new Map(rows.map((r) => [r.date, r]));

  const weeks: { label: string; total: number }[] = [];
  let weekStart = 1;

  while (weekStart <= daysInMonth) {
    const weekEnd = Math.min(weekStart + 6, daysInMonth);
    const startStr = `${y}-${String(m).padStart(2, "0")}-${String(weekStart).padStart(2, "0")}`;
    const endStr = `${y}-${String(m).padStart(2, "0")}-${String(weekEnd).padStart(2, "0")}`;

    let total = 0;
    for (let d = weekStart; d <= weekEnd; d++) {
      const ds = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const row = rowMap.get(ds);
      if (row) {
        total +=
          row.breakfast +
          row.lunch +
          row.dinner +
          row.otherExpenses.reduce((s, e) => s + e.amount, 0);
      }
    }

    const label = `Week ${weeks.length + 1} — ${formatDayLabel(startStr).replace(/\w+,\s/, "")} – ${formatDayLabel(endStr).replace(/\w+,\s/, "")}`;
    weeks.push({ label, total });
    weekStart += 7;
  }

  return weeks;
}

// ─── compute category totals ─────────────────────────────────────────────────

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
      if (item.category in totals) {
        totals[item.category] += item.amount;
      } else {
        totals["Other"] += item.amount;
      }
    }
  }

  return totals;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthFromUrl = searchParams.get("month") ?? getCurrentMonth();
  const [month, setMonth] = useState(monthFromUrl);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [income, setIncome] = useState<IncomeRow>({
    salary: 0,
    freelance: 0,
    other: 0,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    setMonth(monthFromUrl);
  }, [monthFromUrl]);

  const loadMonthData = useCallback(async (m: string) => {
    setLoadingData(true);
    try {
      const [expRows, incRow] = await Promise.all([
        getExpensesByMonth(m),
        getIncomeByMonth(m),
      ]);
      setExpenseRows(expRows as ExpenseRow[]);
      setIncome(
        incRow
          ? {
              salary: incRow.salary,
              freelance: incRow.freelance,
              other: incRow.other,
            }
          : { salary: 0, freelance: 0, other: 0 }
      );
    } catch {
      showToast("Failed to load month data.", "error");
    } finally {
      setLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMonthData(month);
  }, [month, loadMonthData]);

  const handleMonthChange = (nextMonth: string) => {
    setMonth(nextMonth);
    router.replace(`/dashboard?month=${nextMonth}`, { scroll: false });
  };

  const handleUpdateIncome = async () => {
    setSavingIncome(true);
    try {
      await upsertIncome({ month, ...income });
      showToast("Income updated!", "success");
    } catch {
      showToast("Failed to update income.", "error");
    } finally {
      setSavingIncome(false);
    }
  };

  // ── calculations
  const totalIncome = income.salary + income.freelance + income.other;
  const categoryTotals = getCategoryTotals(expenseRows);
  const totalSpent = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
  const balance = totalIncome - totalSpent;
  const weeks = getWeeks(month, expenseRows);

  // Daily rows with totals (only days with data)
  const dailyRows = expenseRows
    .map((row) => {
      const total =
        row.breakfast +
        row.lunch +
        row.dinner +
        row.otherExpenses.reduce((s, e) => s + e.amount, 0);
      return { ...row, total };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <MonthSelector month={month} onChange={handleMonthChange} />
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-16">
            <svg
              className="h-8 w-8 animate-spin text-brand-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        ) : (
          <>
            {/* ── Income card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Income
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Salary",
                    key: "salary" as keyof IncomeRow,
                  },
                  {
                    label: "Freelance",
                    key: "freelance" as keyof IncomeRow,
                  },
                  {
                    label: "Other",
                    key: "other" as keyof IncomeRow,
                  },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-400">
                      {label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={income[key] || ""}
                        placeholder="0"
                        onChange={(e) =>
                          setIncome((prev) => ({
                            ...prev,
                            [key]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-7 pr-2 py-3 text-sm text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors no-spinner"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                <span className="text-sm text-slate-400">Total Income</span>
                <span className="text-base font-bold text-emerald-400">
                  {formatCurrency(totalIncome)}
                </span>
              </div>

              <button
                onClick={handleUpdateIncome}
                disabled={savingIncome}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-brand-600 hover:bg-brand-900/30 hover:text-brand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingIncome ? "Saving…" : "Update Income"}
              </button>
            </div>

            {/* ── Summary cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Total Income
                </p>
                <p className="text-lg font-bold text-emerald-400">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Total Spent
                </p>
                <p className="text-lg font-bold text-rose-400">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div
                className={`col-span-2 sm:col-span-1 rounded-2xl border p-4 space-y-1 ${
                  balance >= 0
                    ? "border-emerald-800/50 bg-emerald-950/20"
                    : "border-red-800/50 bg-red-950/20"
                }`}
              >
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Balance
                </p>
                <p
                  className={`text-lg font-bold ${
                    balance >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {balance >= 0 ? "+" : ""}
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>

            {/* ── Category breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Category Breakdown
              </h2>

              {totalSpent === 0 ? (
                <p className="text-sm text-slate-600 text-center py-4">
                  No expenses this month
                </p>
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

            {/* ── Daily log preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Daily Log
              </h2>

              {dailyRows.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-4">
                  No expense entries this month yet
                </p>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {dailyRows.map((row) => {
                    const notes = row.otherExpenses
                      .filter((e) => e.note)
                      .map((e) => e.note)
                      .join(", ");
                    return (
                      <button
                        key={row.date}
                        onClick={() =>
                          router.push(`/log?date=${row.date}`)
                        }
                        className="w-full rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-3 text-left hover:border-brand-700 hover:bg-brand-950/20 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-300 group-hover:text-brand-300 transition-colors">
                            {formatDayLabel(row.date)}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(row.total)}
                          </span>
                        </div>
                        {notes && (
                          <p className="mt-0.5 text-xs text-slate-500 truncate">
                            {notes}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
