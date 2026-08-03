"use client";

interface MonthSelectorProps {
  month: string; // "YYYY-MM"
  onChange: (month: string) => void;
}

function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  const newY = date.getFullYear();
  const newM = String(date.getMonth() + 1).padStart(2, "0");
  return `${newY}-${newM}`;
}

function formatLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  // Using short month format for better mobile fitting (e.g. "Aug 2026")
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function MonthSelector({ month, onChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-1 backdrop-blur-sm shadow-md transition-all duration-200">
      <button
        onClick={() => onChange(addMonths(month, -1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 active:scale-90"
        aria-label="Previous month"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <span className="min-w-[7rem] sm:min-w-[8.5rem] text-center text-xs sm:text-sm font-bold text-slate-200 select-none">
        {formatLabel(month)}
      </span>

      <button
        onClick={() => onChange(addMonths(month, 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 active:scale-90"
        aria-label="Next month"
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
  );
}

