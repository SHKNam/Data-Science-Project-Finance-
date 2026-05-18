"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DarkTooltip } from "./recharts-tooltip";
import type { BenfordRow } from "@/lib/data";

export function BenfordBar({ rows }: { rows: BenfordRow[] }) {
  const columns = Array.from(new Set(rows.map((r) => r.column)));
  const [col, setCol] = useState(columns[0]);
  const filtered = rows.filter((r) => r.column === col).sort((a, b) => a.digit - b.digit);
  const stat = filtered[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex gap-1">
          {columns.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCol(c)}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                col === c
                  ? "bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)]"
                  : "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {stat && (
          <div className="text-[11px] tabular text-[var(--text-muted)]">
            χ² = {stat.chi2.toFixed(1)} · p = {stat.p_value.toFixed(4)}{" "}
            <span className={stat.conforms ? "text-emerald-400" : "text-red-400"}>
              · {stat.conforms ? "준수" : "위반"}
            </span>
          </div>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filtered} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
            <XAxis
              dataKey="digit"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: "첫째 자릿수", fontSize: 10, fill: "var(--text-dim)", dy: 12 }}
            />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "oklch(1 0 0 / 0.04)" }} content={<DarkTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="actual_prop" name="실제" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            <Line dataKey="expected_prop" name="Benford 기대값" stroke="var(--chart-1)" strokeWidth={2} dot />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
