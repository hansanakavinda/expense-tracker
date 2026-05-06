"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import MonthSelector from "@/components/MonthSelector";
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

// ─── component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthFromUrl = searchParams.get("month") ?? getCurrentMonth();
  const [month, setMonth] = useState(monthFromUrl);

  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [income, setIncome] = useState<IncomeRow>({ salary: 0, freelance: 0, other: 0 });
  const [loadingData, setLoadingData] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    setMonth(monthFromUrl);
  }, [monthFromUrl]);

  const loadDashboardData = useCallback(
    async (m: string) => {
      setLoadingData(true);
      try {
        const [expRows, incRow] = await Promise.all([
          getExpensesByMonth(m),
          getIncomeByMonth(m),
        ]);
        setExpenseRows(expRows as ExpenseRow[]);
        setIncome(
          incRow
            ? { salary: incRow.salary, freelance: incRow.freelance, other: incRow.other }
            : { salary: 0, freelance: 0, other: 0 }
        );
      } catch {
        showToast("Failed to load month data.", "error");
      } finally {
        setLoadingData(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadDashboardData(month);
  }, [month, loadDashboardData]);

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
  const totalSpent = expenseRows.reduce(
    (s, row) =>
      s +
      row.breakfast +
      row.lunch +
      row.dinner +
      row.otherExpenses.reduce((a, e) => a + e.amount, 0),
    0
  );
  const balance = totalIncome - totalSpent;

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
            <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
                {(
                  [
                    { label: "Salary", key: "salary" as keyof IncomeRow },
                    { label: "Freelance", key: "freelance" as keyof IncomeRow },
                    { label: "Other", key: "other" as keyof IncomeRow },
                  ] as const
                ).map(({ label, key }) => (
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
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Income</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Spent</p>
                <p className="text-lg font-bold text-rose-400">{formatCurrency(totalSpent)}</p>
              </div>
              <div
                className={`col-span-2 sm:col-span-1 rounded-2xl border p-4 space-y-1 ${
                  balance >= 0
                    ? "border-emerald-800/50 bg-emerald-950/20"
                    : "border-red-800/50 bg-red-950/20"
                }`}
              >
                <p className="text-xs text-slate-500 uppercase tracking-wide">Balance</p>
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

            {/* ── Analytics link */}
            <Link
              href={`/analytics?month=${month}`}
              className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 hover:border-brand-700 hover:bg-brand-950/10 transition-colors group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-300 group-hover:text-brand-300 transition-colors">
                  View Analytics
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Spending trends, category breakdown &amp; weekly patterns
                </p>
              </div>
              <svg
                className="h-5 w-5 text-slate-500 group-hover:text-brand-400 transition-colors shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>

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
                        onClick={() => router.push(`/log?date=${row.date}`)}
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
                          <p className="mt-0.5 text-xs text-slate-500 truncate">{notes}</p>
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
