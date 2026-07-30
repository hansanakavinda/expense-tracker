"use client";

export const CATEGORIES = [
  "Transport",
  "Utilities & Bills",
  "Groceries & Snacks",
  "Health",
  "Entertainment",
  "Other",
] as const;

export type OtherExpenseEntry = {
  category: string;
  amount: number;
  note: string;
};

interface OtherExpenseRowProps {
  entry: OtherExpenseEntry;
  index: number;
  onChange: (index: number, entry: OtherExpenseEntry) => void;
  onRemove: (index: number) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Transport: "🚌",
  "Utilities & Bills": "💡",
  "Groceries & Snacks": "🛒",
  Health: "🏥",
  Entertainment: "🎬",
  Other: "📦",
};

export default function OtherExpenseRow({
  entry,
  index,
  onChange,
  onRemove,
}: OtherExpenseRowProps) {
  return (
    <div className="group relative flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2">
      {/* Category Selection */}
      <div className="w-full sm:w-36 shrink-0">
        <select
          value={entry.category}
          onChange={(e) => onChange(index, { ...entry, category: e.target.value })}
          className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-2.5 py-1.5 text-xs font-semibold text-slate-350 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat} className="bg-slate-950 text-white">
              {(CATEGORY_ICONS[cat] ? CATEGORY_ICONS[cat] + " " : "") + cat}
            </option>
          ))}
        </select>
      </div>

      {/* Note & Amount grouped in a row on mobile */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Note */}
        <input
          type="text"
          value={entry.note}
          placeholder="e.g. Tuk, bus fare"
          onChange={(e) => onChange(index, { ...entry, note: e.target.value })}
          className="flex-1 rounded-lg border border-slate-800 bg-slate-950/20 px-2.5 py-1.5 text-xs text-white placeholder-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors min-w-0 font-medium"
        />

        {/* Amount */}
        <div className="relative w-24 shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-semibold">
            Rs.
          </span>
          <input
            type="number"
            min={0}
            value={entry.amount || ""}
            placeholder="0"
            onChange={(e) =>
              onChange(index, { ...entry, amount: parseInt(e.target.value) || 0 })
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 pl-8 pr-1.5 py-1.5 text-xs font-bold text-white placeholder-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors no-spinner"
          />
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-950/30 hover:text-red-400 transition-colors shrink-0"
          aria-label="Remove expense"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
