"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DarkTooltip } from "./recharts-tooltip";

type Bar = { key: string; label: string; color: string };

export function MetricBar({
  data,
  bars,
  xKey,
  height = 320,
  layout = "horizontal",
}: {
  data: Array<Record<string, string | number>>;
  bars: Bar[];
  xKey: string;
  height?: number;
  layout?: "horizontal" | "vertical";
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={layout} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
          {layout === "horizontal" ? (
            <>
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey={xKey}
                tick={{ fontSize: 11 }}
                width={120}
                axisLine={false}
                tickLine={false}
              />
            </>
          )}
          <Tooltip cursor={{ fill: "oklch(1 0 0 / 0.04)" }} content={<DarkTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
