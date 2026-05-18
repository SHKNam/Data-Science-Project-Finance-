"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { DarkTooltip } from "./recharts-tooltip";

type Row = { metric: string; you: number; cluster: number };

export function RadarComparison({ data }: { data: Row[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="oklch(1 0 0 / 0.08)" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fontSize: 9 }} stroke="oklch(1 0 0 / 0.1)" />
          <Radar
            name="이 기업"
            dataKey="you"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.25}
          />
          <Radar
            name="동일 클러스터 평균"
            dataKey="cluster"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.12}
          />
          <Tooltip content={<DarkTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
