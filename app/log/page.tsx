"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OtherExpenseRow, {
  type OtherExpenseEntry,
} from "@/components/OtherExpenseRow";
import { Toast, useToast } from "@/components/Toast";
import { getExpenseByDate, upsertExpense } from "@/actions/expenses";

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  const nd = String(date.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function LogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialDate = searchParams.get("date") ?? getTodayString();
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const [breakfast, setBreakfast] = useState(0);
  const [lunch, setLunch] = useState(0);
  const [dinner, setDinner] = useState(0);
  const [others, setOthers] = useState<OtherExpenseEntry[]>([]);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  const loadData = useCallback(async (date: string) => {
    setLoading(true);
    setHasSavedData(false);
    try {
      const data = await getExpenseByDate(date);
      if (data) {
        setBreakfast(data.breakfast);
        setLunch(data.lunch);
        setDinner(data.dinner);
        setOthers((data.otherExpenses as OtherExpenseEntry[]) ?? []);
        setHasSavedData(true);
      } else {
        setBreakfast(0);
        setLunch(0);
        setDinner(0);
        setOthers([]);
      }
    } catch {
      showToast("Failed to load data for this date.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    router.replace(`/log?date=${date}`, { scroll: false });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertExpense({
        date: selectedDate,
        breakfast,
        lunch,
        dinner,
        otherExpenses: others,
      });
      setHasSavedData(true);
      showToast("Saved successfully!", "success");
    } catch {
      showToast("Failed to save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addOther = () => {
    setOthers((prev) => [
      ...prev,
      { category: "Transport", amount: 0, note: "" },
    ]);
  };

  const updateOther = (index: number, entry: OtherExpenseEntry) => {
    setOthers((prev) => prev.map((e, i) => (i === index ? entry : e)));
  };

  const removeOther = (index: number) => {
    setOthers((prev) => prev.filter((_, i) => i !== index));
  };

  const today = getTodayString();
  const isToday = selectedDate === today;

  const totalMeals = breakfast + lunch + dinner;
  const totalOther = others.reduce((s, e) => s + e.amount, 0);
  const totalDay = totalMeals + totalOther;

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white">Daily Log</h1>
          <p className="text-sm text-slate-400">
            {formatDateLabel(selectedDate)}
          </p>
        </div>

        {/* Date selector card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label
                htmlFor="date-input"
                className="mb-1 block text-xs font-medium text-slate-400 uppercase tracking-wide"
              >
                Date
              </label>
              <input
                id="date-input"
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            {/* Saved badge */}
            {hasSavedData && !loading && (
              <div className="mt-5 flex items-center gap-1.5 rounded-full bg-emerald-900/40 px-3 py-1 border border-emerald-700/50">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">
                  Saved
                </span>
              </div>
            )}
          </div>

          {/* Prev / Next day */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateChange(addDays(selectedDate, -1))}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-400 hover:border-brand-600 hover:text-brand-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Previous day
            </button>
            <button
              onClick={() => handleDateChange(addDays(selectedDate, +1))}
              disabled={isToday}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-400 hover:border-brand-600 hover:text-brand-400 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next day
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
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
            {/* Meals section */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Meals
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Breakfast", value: breakfast, set: setBreakfast },
                  { label: "Lunch", value: lunch, set: setLunch },
                  { label: "Dinner", value: dinner, set: setDinner },
                ].map(({ label, value, set }) => (
                  <div key={label} className="space-y-1.5">
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
                        value={value || ""}
                        placeholder="0"
                        onChange={(e) => set(parseInt(e.target.value) || 0)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-7 pr-2 py-3 text-sm text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors no-spinner"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Meal subtotal */}
              {totalMeals > 0 && (
                <div className="flex justify-between border-t border-slate-800 pt-2 text-sm">
                  <span className="text-slate-500">Meal total</span>
                  <span className="font-medium text-slate-300">
                    Rs. {totalMeals.toLocaleString("en-LK")}
                  </span>
                </div>
              )}
            </div>

            {/* Other Expenses */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Other Expenses
                </h2>
                {others.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {others.length} item{others.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {others.length === 0 && (
                <p className="py-3 text-center text-sm text-slate-600">
                  No other expenses yet
                </p>
              )}

              <div className="space-y-2">
                {others.map((entry, index) => (
                  <OtherExpenseRow
                    key={index}
                    entry={entry}
                    index={index}
                    onChange={updateOther}
                    onRemove={removeOther}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={addOther}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-400 hover:border-brand-600 hover:bg-brand-950/20 hover:text-brand-400 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Expense
              </button>
            </div>

            {/* Day total + Save */}
            <div className="rounded-2xl border border-brand-800/50 bg-brand-950/20 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">
                  Total for the day
                </span>
                <span className="text-lg font-bold text-brand-300">
                  Rs. {totalDay.toLocaleString("en-LK")}
                </span>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
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
                    Saving…
                  </span>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
