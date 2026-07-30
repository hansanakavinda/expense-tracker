"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import OtherExpenseRow, {
  CATEGORIES,
  type OtherExpenseEntry,
} from "@/components/OtherExpenseRow";
import { Toast, useToast } from "@/components/Toast";
import { getExpenseByDate, upsertExpense } from "@/actions/expenses";
import { getExpensePresets } from "@/actions/presets";
import type { ExpensePresetItem } from "@/lib/schema";

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

// Map category names to emoji icons
const CATEGORY_ICONS: Record<string, string> = {
  Transport: "🚌",
  "Utilities & Bills": "💡",
  "Groceries & Snacks": "🛒",
  Health: "🏥",
  Entertainment: "🎬",
  Other: "📦",
};

export default function LogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialDate = searchParams.get("date") ?? getTodayString();
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const [breakfast, setBreakfast] = useState(0);
  const [lunch, setLunch] = useState(0);
  const [dinner, setDinner] = useState(0);
  const [others, setOthers] = useState<OtherExpenseEntry[]>([]);
  const [presets, setPresets] = useState<Array<ExpensePresetItem & { id: string }>>([]);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  const loadData = useCallback(
    async (date: string) => {
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
    },
    [showToast]
  );

  const loadPresets = useCallback(async () => {
    try {
      const items = await getExpensePresets();
      setPresets(items as Array<ExpensePresetItem & { id: string }>);
    } catch {
      showToast("Failed to load presets.", "error");
    }
  }, [showToast]);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

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

  const addPresetToLog = (preset: ExpensePresetItem & { id: string }) => {
    setOthers((prev) => [
      ...prev,
      {
        category: preset.category,
        amount: preset.amount,
        note: preset.note,
      },
    ]);
    showToast(`"${preset.label}" added to log.`, "success");
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

      <div className="space-y-5 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">Daily Log</h1>
              {hasSavedData && !loading && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Saved
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {formatDateLabel(selectedDate)}
            </p>
          </div>

          {/* Date Selector and Prev/Next switchers */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-850 px-1.5 py-1 rounded-xl shadow-sm">
            {/* Prev button */}
            <button
              onClick={() => handleDateChange(addDays(selectedDate, -1))}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-850 hover:text-white transition-colors"
              aria-label="Previous day"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Date input wrapper */}
            <div className="relative flex items-center">
              <input
                id="date-input"
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => handleDateChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors pointer-events-none select-none"
              >
                <svg className="h-3.5 w-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{selectedDate === today ? "Today" : selectedDate}</span>
              </button>
            </div>

            {/* Next button */}
            <button
              onClick={() => handleDateChange(addDays(selectedDate, 1))}
              disabled={isToday}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-850 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Next day"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Meals
                </h2>
                {totalMeals > 0 && (
                  <span className="text-xs font-bold text-slate-300">
                    Subtotal: Rs. {totalMeals.toLocaleString("en-LK")}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Breakfast", value: breakfast, set: setBreakfast },
                  { label: "Lunch", value: lunch, set: setLunch },
                  { label: "Dinner", value: dinner, set: setDinner },
                ].map(({ label, value, set }) => (
                  <div key={label} className="relative rounded-xl border border-slate-800 bg-slate-950/40 p-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-colors">
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      {label}
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xs font-medium text-slate-600">Rs.</span>
                      <input
                        type="number"
                        min={0}
                        value={value || ""}
                        placeholder="0"
                        onChange={(e) => set(parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-750 focus:outline-none no-spinner"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Presets
                  </h2>
                  <span className="text-[10px] text-slate-500">Tap to add</span>
                </div>
                <Link
                  href="/settings"
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
                >
                  Manage →
                </Link>
              </div>

              {presets.length === 0 ? (
                <div className="py-2 text-center">
                  <p className="text-xs text-slate-600">No presets configured.</p>
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 md:flex-wrap">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => addPresetToLog(preset)}
                      className="flex items-center gap-1.5 shrink-0 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-brand-500 hover:bg-brand-950/10 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-all duration-150 active:scale-95"
                    >
                      <span className="text-sm">
                        {CATEGORY_ICONS[preset.category] ?? "📦"}
                      </span>
                      <span className="font-semibold text-slate-200">{preset.label}</span>
                      <span className="text-slate-500 font-medium">Rs. {preset.amount.toLocaleString("en-LK")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Other Expenses */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Other Expenses
                </h2>
                {others.length > 0 && (
                  <span className="text-xs font-bold text-slate-500">
                    {others.length} item{others.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {others.length === 0 ? (
                <div className="py-2 text-center">
                  <p className="text-xs text-slate-500">No other expenses logged for this day.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/40 space-y-3">
                  {others.map((entry, index) => (
                    <div key={index} className={index > 0 ? "pt-3" : ""}>
                      <OtherExpenseRow
                        entry={entry}
                        index={index}
                        onChange={updateOther}
                        onRemove={removeOther}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addOther}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 hover:border-brand-500/50 hover:bg-brand-950/10 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-brand-400 transition-all duration-150 active:scale-[0.99]"
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
            <div className="rounded-2xl border border-brand-800/30 bg-brand-950/15 p-4.5 space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">
                  Total for the day
                </span>
                <span className="text-xl font-bold text-brand-400">
                  Rs. {totalDay.toLocaleString("en-LK")}
                </span>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-600/15 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.99]"
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
                  "Save Log"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
