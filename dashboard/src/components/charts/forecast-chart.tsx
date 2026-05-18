"use client";

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DarkTooltip } from "./recharts-tooltip";
import type { DisclosureMonthly, Forecast } from "@/lib/data";

export function ForecastChart({
  history,
  forecasts,
}: {
  history: DisclosureMonthly[];
  forecasts: Forecast[];
}) {
  // Merge
  const fcMap = new Map(forecasts.map((f) => [f.year_month.substring(0, 7), f]));
  const data = history.map((h) => {
    const key = h.year_month.substring(0, 7);
    const f = fcMap.get(key);
    return {
      ym: key,
      actual: h.count,
      arima: f?.arima ?? null,
      prophet: f?.prophet ?? null,
      lstm: f?.lstm ?? null,
      gru: f?.gru ?? null,
      transformer: f?.transformer ?? null,
    };
  });

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
          <XAxis dataKey="ym" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<DarkTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line dataKey="actual" name="실제" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 2 }} isAnimationActive={false} />
          <Line dataKey="arima" name="ARIMA" stroke="var(--chart-1)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="prophet" name="Prophet" stroke="var(--chart-3)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="lstm" name="LSTM" stroke="var(--chart-4)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="gru" name="GRU" stroke="var(--chart-5)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="transformer" name="Transformer" stroke="#ec4899" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
