"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DarkTooltip } from "./recharts-tooltip";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

type CurveData = Record<string, { fpr?: number[]; tpr?: number[]; precision?: number[]; recall?: number[] }>;

export function RocPrChart({
  data,
  type,
  height = 300,
}: {
  data: CurveData;
  type: "roc" | "pr";
  height?: number;
}) {
  const allModels = Object.keys(data);
  const [selected, setSelected] = useState<string[]>(allModels.slice(0, 5));

  const xKey = type === "roc" ? "fpr" : "recall";
  const yKey = type === "roc" ? "tpr" : "precision";

  const lineData: Array<Record<string, number>> = [];
  // 100 grid points
  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    const row: Record<string, number> = { x };
    for (const m of selected) {
      const xs = (data[m] as Record<string, number[]>)[xKey];
      const ys = (data[m] as Record<string, number[]>)[yKey];
      if (!xs || !ys) continue;
      // find closest
      let yVal = ys[0];
      let best = Infinity;
      for (let j = 0; j < xs.length; j++) {
        const d = Math.abs(xs[j] - x);
        if (d < best) {
          best = d;
          yVal = ys[j];
        }
      }
      row[m] = yVal;
    }
    lineData.push(row);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3 px-2">
        {allModels.map((m, i) => {
          const active = selected.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() =>
                setSelected((prev) =>
                  active ? prev.filter((x) => x !== m) : [...prev, m].slice(-7),
                )
              }
              className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                active
                  ? "border-[var(--border-strong)] text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]"
              }`}
              style={active ? { borderColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] } : undefined}
            >
              {m}
            </button>
          );
        })}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 1]}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{ value: type === "roc" ? "FPR" : "Recall", fontSize: 10, fill: "var(--text-dim)", dy: 12 }}
            />
            <YAxis
              type="number"
              domain={[0, 1]}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{ value: type === "roc" ? "TPR" : "Precision", angle: -90, fontSize: 10, fill: "var(--text-dim)", dx: -10 }}
            />
            <Tooltip content={<DarkTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {type === "roc" && (
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: 1, y: 1 },
                ]}
                stroke="oklch(1 0 0 / 0.15)"
                strokeDasharray="3 3"
              />
            )}
            {selected.map((m, i) => (
              <Line
                key={m}
                dataKey={m}
                stroke={COLORS[allModels.indexOf(m) % COLORS.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
