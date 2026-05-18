"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DarkTooltip } from "./recharts-tooltip";

export function VotesHistogram({ data }: { data: Array<{ votes: number; count: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
          <XAxis
            dataKey="votes"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: "이상치 합의 votes", fontSize: 10, fill: "var(--text-dim)", dy: 12 }}
          />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "oklch(1 0 0 / 0.04)" }} content={<DarkTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d) => {
              const color = d.votes >= 4 ? "#ef4444" : d.votes >= 2 ? "#f59e0b" : "#3b82f6";
              return <Cell key={d.votes} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
