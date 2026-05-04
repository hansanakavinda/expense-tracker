interface CategoryBarProps {
  label: string;
  amount: number;
  total: number;
  color?: string;
}

function formatCurrency(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

export default function CategoryBar({
  label,
  amount,
  total,
  color = "bg-brand-500",
}: CategoryBarProps) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <div className="flex items-center gap-2 text-right">
          <span className="text-slate-400 text-xs">{pct}%</span>
          <span className="font-medium text-white min-w-[5rem] text-right">
            {formatCurrency(amount)}
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
