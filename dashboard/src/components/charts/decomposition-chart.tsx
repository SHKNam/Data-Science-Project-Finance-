"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DarkTooltip } from "./recharts-tooltip";
import type { Decomposition } from "@/lib/data";

export function DecompositionChart({ data }: { data: Decomposition[] }) {
  const rows = data.map((d) => ({ ...d, ym: d.year_month.substring(0, 7) }));
  return (
    <div className="space-y-2">
      {[
        { key: "trend", label: "Trend", color: "var(--chart-1)" },
        { key: "seasonal", label: "Seasonal", color: "var(--chart-3)" },
        { key: "residual", label: "Residual", color: "var(--chart-4)" },
      ].map((row) => (
        <div key={row.key}>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] pl-3">
            {row.label}
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.04)" />
                <XAxis dataKey="ym" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<DarkTooltip />} />
                <Line dataKey={row.key} stroke={row.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
