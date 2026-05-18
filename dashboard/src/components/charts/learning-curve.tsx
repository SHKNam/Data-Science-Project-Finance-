"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DarkTooltip } from "./recharts-tooltip";

const COLORS = ["#10b981", "#3b82f6", "#a855f7"];

export function LearningCurve({ data }: { data: Record<string, number[]> }) {
  const models = Object.keys(data);
  const maxLen = Math.max(...models.map((m) => data[m].length));
  const rows: Array<Record<string, number>> = [];
  for (let i = 0; i < maxLen; i++) {
    const row: Record<string, number> = { epoch: i + 1 };
    for (const m of models) {
      if (data[m][i] !== undefined) row[m] = data[m][i];
    }
    rows.push(row);
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
          <XAxis dataKey="epoch" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<DarkTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {models.map((m, i) => (
            <Line
              key={m}
              dataKey={m}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
