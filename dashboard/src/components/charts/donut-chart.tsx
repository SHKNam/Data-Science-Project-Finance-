"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { DarkTooltip } from "./recharts-tooltip";

const COLORS = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#fb7185"];

export function DonutChart({
  data,
  height = 240,
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<DarkTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
