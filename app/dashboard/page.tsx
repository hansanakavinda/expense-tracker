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
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
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
      setIsIncomeModalOpen(false);
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

  // Chart bar heights
  const chartMaxVal = Math.max(1, totalIncome, totalSpent);
  const incomeHeight = totalIncome > 0 ? Math.max(2, (totalIncome / chartMaxVal) * 100) : 0;
  const salaryHeight = (income.salary / chartMaxVal) * 100;
  const freelanceHeight = (income.freelance / chartMaxVal) * 100;
  const otherHeight = (income.other / chartMaxVal) * 100;

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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 mt-1">
              Overview of your finances and monthly logs
            </p>
          </div>
          <div className="shrink-0">
            <MonthSelector month={month} onChange={handleMonthChange} />
          </div>
        </div>

        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute h-full w-full rounded-full border-4 border-slate-900"></div>
              <div className="absolute h-full w-full rounded-full border-4 border-t-brand-500 animate-spin"></div>
            </div>
            <p className="text-xs text-slate-500 animate-pulse">Loading dashboard details...</p>
          </div>
        ) : (
          <>
            {/* ── Summary Chart Card */}
            <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/40 p-6 shadow-xl backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Financial Summary
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Monthly income, expenses and net balance comparison
                  </p>
                </div>
                
                <button
                  onClick={() => setIsIncomeModalOpen(true)}
                  className="text-[10px] font-bold text-brand-400 hover:text-brand-305 bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 rounded-lg transition-colors active:scale-95 shrink-0"
                  title="Update Income"
                >
                  Update Income
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* SVG Chart */}
                <div className="md:col-span-7 flex justify-center">
                  <div className="w-full max-w-xs h-44">
                    <svg viewBox="0 0 320 160" className="w-full h-full overflow-visible">
                      <defs>
                        {/* Income stack segments gradients */}
                        <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d9488" />
                          <stop offset="100%" stopColor="#0f766e" />
                        </linearGradient>
                        <linearGradient id="freelanceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="otherGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>

                        <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f87171" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <linearGradient id="balancePosGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                        <linearGradient id="balanceNegGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fca5a5" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>

                        {/* Income rounded clip-path mask */}
                        {totalIncome > 0 && (
                          <clipPath id="incomeClip">
                            <rect
                              x="45"
                              y={120 - incomeHeight}
                              width="34"
                              height={incomeHeight}
                              rx="6"
                            />
                          </clipPath>
                        )}
                      </defs>

                      {/* Gridlines */}
                      <line x1="10" y1="20" x2="310" y2="20" stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="3 3" />
                      <line x1="10" y1="65" x2="310" y2="65" stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="3 3" />
                      <line x1="10" y1="110" x2="310" y2="110" stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="3 3" />
                      
                      {/* X-Axis Base Line */}
                      <line x1="10" y1="120" x2="310" y2="120" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />

                      {/* Bars */}
                      {/* 1. Income Bar (Stacked Segmented) */}
                      {totalIncome > 0 ? (
                        <g clipPath="url(#incomeClip)" className="transition-all duration-300 hover:opacity-90">
                          {/* Salary Segment (bottom) */}
                          {income.salary > 0 && (
                            <rect
                              x="45"
                              y={120 - salaryHeight}
                              width="34"
                              height={salaryHeight + 1}
                              fill="url(#salaryGrad)"
                            />
                          )}
                          {/* Freelance Segment (middle) */}
                          {income.freelance > 0 && (
                            <rect
                              x="45"
                              y={120 - salaryHeight - freelanceHeight}
                              width="34"
                              height={freelanceHeight + 1}
                              fill="url(#freelanceGrad)"
                            />
                          )}
                          {/* Other Segment (top) */}
                          {income.other > 0 && (
                            <rect
                              x="45"
                              y={120 - salaryHeight - freelanceHeight - otherHeight}
                              width="34"
                              height={otherHeight + 1}
                              fill="url(#otherGrad)"
                            />
                          )}
                        </g>
                      ) : (
                        <rect
                          x="45"
                          y="118"
                          width="34"
                          height="2"
                          rx="1"
                          fill="rgba(148, 163, 184, 0.1)"
                        />
                      )}

                      {/* 2. Spent Bar */}
                      <rect
                        x="143"
                        y={120 - (totalSpent > 0 ? Math.max(2, (totalSpent / chartMaxVal) * 100) : 0)}
                        width="34"
                        height={totalSpent > 0 ? Math.max(2, (totalSpent / chartMaxVal) * 100) : 0}
                        rx="6"
                        fill="url(#spentGrad)"
                        className="transition-all duration-300 hover:opacity-90"
                      />

                      {/* 3. Balance Bar */}
                      <rect
                        x="241"
                        y={120 - (Math.abs(balance) > 0 ? Math.max(2, (Math.abs(balance) / Math.max(1, totalIncome, totalSpent)) * 100) : 0)}
                        width="34"
                        height={Math.abs(balance) > 0 ? Math.max(2, (Math.abs(balance) / Math.max(1, totalIncome, totalSpent)) * 100) : 0}
                        rx="6"
                        fill={balance >= 0 ? "url(#balancePosGrad)" : "url(#balanceNegGrad)"}
                        className="transition-all duration-300 hover:opacity-90"
                      />

                      {/* Axis Labels */}
                      <text x="62" y="140" textAnchor="middle" className="fill-slate-400 text-[10px] font-bold tracking-wider">INCOME</text>
                      <text x="160" y="140" textAnchor="middle" className="fill-slate-400 text-[10px] font-bold tracking-wider">SPENT</text>
                      <text x="258" y="140" textAnchor="middle" className="fill-slate-400 text-[10px] font-bold tracking-wider">BALANCE</text>

                      {/* Value labels on top of bars */}
                      <text
                        x="62"
                        y={120 - (totalIncome > 0 ? Math.max(2, (totalIncome / Math.max(1, totalIncome, totalSpent)) * 100) : 0) - 6}
                        textAnchor="middle"
                        className="fill-emerald-400 text-[10px] font-extrabold tracking-tight"
                      >
                        {formatCurrency(totalIncome).replace("Rs. ", "")}
                      </text>
                      <text
                        x="160"
                        y={120 - (totalSpent > 0 ? Math.max(2, (totalSpent / Math.max(1, totalIncome, totalSpent)) * 100) : 0) - 6}
                        textAnchor="middle"
                        className="fill-rose-400 text-[10px] font-extrabold tracking-tight"
                      >
                        {formatCurrency(totalSpent).replace("Rs. ", "")}
                      </text>
                      <text
                        x="258"
                        y={120 - (Math.abs(balance) > 0 ? Math.max(2, (Math.abs(balance) / Math.max(1, totalIncome, totalSpent)) * 100) : 0) - 6}
                        textAnchor="middle"
                        className={`text-[10px] font-extrabold tracking-tight ${balance >= 0 ? "fill-brand-400" : "fill-red-400"}`}
                      >
                        {balance < 0 ? "-" : ""}{formatCurrency(Math.abs(balance)).replace("Rs. ", "")}
                      </text>
                    </svg>
                  </div>
                </div>

                {/* Values Legend */}
                <div className="md:col-span-5 space-y-4 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
                  {/* Legend Rows */}
                  <div className="space-y-3">
                    {/* Income Stack Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          <span className="text-xs font-bold text-slate-300">Total Income</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalIncome)}</span>
                      </div>
                      
                      {/* Sub-categories */}
                      {totalIncome > 0 && (
                        <div className="pl-4 space-y-1.5 border-l border-slate-800/80 ml-1">
                          {income.salary > 0 && (
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                                <span>Salary</span>
                              </div>
                              <span className="font-semibold text-slate-400">{formatCurrency(income.salary)}</span>
                            </div>
                          )}
                          {income.freelance > 0 && (
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Freelance</span>
                              </div>
                              <span className="font-semibold text-slate-400">{formatCurrency(income.freelance)}</span>
                            </div>
                          )}
                          {income.other > 0 && (
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span>Other</span>
                              </div>
                              <span className="font-semibold text-slate-400">{formatCurrency(income.other)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Spent Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                        <span className="text-xs font-bold text-slate-300">Total Spent</span>
                      </div>
                      <span className="text-sm font-bold text-rose-400">{formatCurrency(totalSpent)}</span>
                    </div>

                    {/* Balance Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${balance >= 0 ? "bg-brand-500" : "bg-red-505"}`} />
                        <span className="text-xs font-bold text-slate-300">Net Balance</span>
                      </div>
                      <span className={`text-sm font-bold ${balance >= 0 ? "text-brand-400" : "text-red-400"}`}>
                        {balance >= 0 ? "+" : ""}
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  </div>

                  {/* Savings / Burn Rate Progress track */}
                  <div className="border-t border-slate-800/80 pt-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Burn Rate / Savings</span>
                      <span>
                        {totalIncome > 0 ? Math.round((totalSpent / totalIncome) * 100) : 0}% Spent
                      </span>
                    </div>
                    
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
                        style={{ width: `${totalIncome > 0 ? Math.min(100, (totalSpent / totalIncome) * 100) : 0}%` }}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-500"
                        style={{ width: `${totalIncome > 0 ? Math.max(0, 100 - (totalSpent / totalIncome) * 100) : 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Analytics link */}
            <Link
              href={`/analytics?month=${month}`}
              className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-gradient-to-r from-slate-900/60 to-slate-950/40 p-5 shadow-lg backdrop-blur-md hover:border-brand-500/50 hover:shadow-brand-950/10 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 group-hover:bg-brand-500/20 group-hover:scale-105 transition-all duration-300">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                    View Analytics
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Spending trends, category breakdown &amp; weekly patterns
                  </p>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/50 text-slate-400 group-hover:text-white group-hover:bg-slate-800 transition-all duration-300">
                <svg
                  className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </Link>

            {/* ── Daily log preview */}
            <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/40 p-6 space-y-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Daily Log
                </h2>
                {dailyRows.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {dailyRows.length} active day{dailyRows.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {dailyRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                  <div className="rounded-full bg-slate-800/30 p-2.5 text-slate-550 border border-slate-800/55">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-400 mt-1">
                    No expense entries this month yet
                  </p>
                  <p className="text-xs text-slate-650">
                    Start logging your expenses in the Log page
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                  {dailyRows.map((row) => {
                    const notes = row.otherExpenses
                      .filter((e) => e.note)
                      .map((e) => e.note)
                      .join(", ");
                    return (
                      <button
                        key={row.date}
                        onClick={() => router.push(`/log?date=${row.date}`)}
                        className="w-full rounded-xl border border-slate-800/60 bg-slate-900/30 hover:bg-slate-800/30 hover:border-slate-700/80 px-4 py-3 text-left transition-all duration-300 group flex items-center justify-between gap-3 active:scale-[0.99]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-350 group-hover:text-white transition-colors">
                            {formatDayLabel(row.date)}
                          </p>
                          {notes ? (
                            <p className="mt-1 text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                              {notes}
                            </p>
                          ) : (
                            <p className="mt-1 text-[10px] text-slate-600 italic">No notes added</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-white tracking-tight">
                            {formatCurrency(row.total)}
                          </span>
                          <svg
                            className="h-4 w-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-300"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Income Modal */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setIsIncomeModalOpen(false)} />
          
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl backdrop-blur-md space-y-6 z-10 animate-modal-entrance">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Update Monthly Income</h3>
                <p className="text-xs text-slate-500 mt-0.5">Adjust income details for {month}</p>
              </div>
              <button
                onClick={() => setIsIncomeModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Inputs */}
            <div className="space-y-4">
              {(
                [
                  { label: "Salary", key: "salary" as keyof IncomeRow },
                  { label: "Freelance", key: "freelance" as keyof IncomeRow },
                  { label: "Other", key: "other" as keyof IncomeRow },
                ] as const
              ).map(({ label, key }) => (
                <div key={key} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    {label}
                  </label>
                  <div className="relative rounded-xl bg-slate-950/40 focus-within:bg-slate-950/70 transition-colors">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 select-none">
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
                      className="w-full rounded-xl border border-slate-800/80 bg-transparent pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all duration-200 hover:border-slate-700 no-spinner"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-400">Projected Total</span>
                <span className="font-extrabold text-emerald-450">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateIncome}
                  disabled={savingIncome}
                  className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-950/20 active:scale-[0.98] py-2.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {savingIncome ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
