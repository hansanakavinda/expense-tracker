"use client";

type SeriesDefinition = {
  key: string;
  label: string;
  color: string;
};

export type ChartPoint = {
  label: string;
  values: Record<string, number>;
};

interface LineChartProps {
  data: ChartPoint[];
  series: SeriesDefinition[];
  height?: number;
  emptyMessage?: string;
}

function formatAxisValue(value: number) {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }

  return `${Math.round(value)}`;
}

export default function LineChart({
  data,
  series,
  height = 240,
  emptyMessage = "No data available.",
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/40 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const top = 20;
  const right = 20;
  const bottom = 34;
  const left = 44;
  const viewWidth = 1000;
  const viewHeight = height;
  const chartWidth = viewWidth - left - right;
  const chartHeight = viewHeight - top - bottom;

  const allValues = data.flatMap((point) =>
    series.map((definition) => point.values[definition.key] ?? 0)
  );
  const maxValue = Math.max(1, ...allValues);
  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;
  const yTicks = 4;
  const labelStep = data.length > 10 ? Math.ceil(data.length / 6) : 1;

  const pointFor = (index: number, value: number) => {
    const x = left + xStep * index;
    const y = top + chartHeight - (value / maxValue) * chartHeight;
    return { x, y };
  };

  const buildPath = (definition: SeriesDefinition) =>
    data
      .map((point, index) => {
        const { x, y } = pointFor(index, point.values[definition.key] ?? 0);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");

  return (
    <div className="space-y-3">
      {series.length > 1 && (
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {series.map((definition) => (
            <div key={definition.key} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: definition.color }}
              />
              <span>{definition.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40">
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="h-60 w-full"
          role="img"
          aria-label="Line chart"
        >
          {Array.from({ length: yTicks + 1 }).map((_, index) => {
            const value = (maxValue / yTicks) * index;
            const y = top + chartHeight - (index / yTicks) * chartHeight;
            return (
              <g key={index}>
                <line
                  x1={left}
                  x2={viewWidth - right}
                  y1={y}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.12)"
                  strokeDasharray="4 6"
                />
                <text
                  x={left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500"
                  style={{ fontSize: 11 }}
                >
                  {formatAxisValue(value)}
                </text>
              </g>
            );
          })}

          {data.map((point, index) => {
            if (index % labelStep !== 0 && index !== data.length - 1) {
              return null;
            }

            const x = pointFor(index, 0).x;
            return (
              <text
                key={point.label}
                x={x}
                y={viewHeight - 12}
                textAnchor="middle"
                className="fill-slate-500"
                style={{ fontSize: 11 }}
              >
                {point.label}
              </text>
            );
          })}

          {series.map((definition) => (
            <path
              key={definition.key}
              d={buildPath(definition)}
              fill="none"
              stroke={definition.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {series.map((definition) =>
            data.map((point, index) => {
              const value = point.values[definition.key] ?? 0;
              const { x, y } = pointFor(index, value);
              return (
                <circle
                  key={`${definition.key}-${point.label}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={definition.color}
                  stroke="#020617"
                  strokeWidth="2"
                />
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
}