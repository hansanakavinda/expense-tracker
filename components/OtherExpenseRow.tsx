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

export default function OtherExpenseRow({
  entry,
  index,
  onChange,
  onRemove,
}: OtherExpenseRowProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-800/50 p-3 sm:flex-row sm:items-center sm:gap-3">
      {/* Category */}
      <select
        value={entry.category}
        onChange={(e) => onChange(index, { ...entry, category: e.target.value })}
        className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 min-w-0"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* Amount */}
      <div className="flex items-center gap-1.5 sm:w-36">
        <span className="text-xs text-slate-400 shrink-0">Rs.</span>
        <input
          type="number"
          min={0}
          value={entry.amount || ""}
          placeholder="0"
          onChange={(e) =>
            onChange(index, { ...entry, amount: parseInt(e.target.value) || 0 })
          }
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 no-spinner"
        />
      </div>

      {/* Note */}
      <input
        type="text"
        value={entry.note}
        placeholder="e.g. Tuk, bus fare"
        onChange={(e) => onChange(index, { ...entry, note: e.target.value })}
        className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 min-w-0"
      />

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="self-end rounded-lg p-2 text-slate-500 hover:bg-red-900/30 hover:text-red-400 transition-colors sm:self-auto"
        aria-label="Remove expense"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
