"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

type Point = {
  corp_code: string;
  corp_name: string;
  health_score: number;
  anomaly_votes: number;
  risk: number;
};

export function QuadrantScatter({ data }: { data: Point[] }) {
  const danger = data.filter((d) => d.risk === 1);
  const normal = data.filter((d) => d.risk === 0);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 16, bottom: 12, left: 12 }}>
          <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
          <XAxis
            type="number"
            dataKey="health_score"
            name="건전성"
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{ value: "건전성 점수", fontSize: 10, fill: "var(--text-dim)", dy: 12 }}
          />
          <YAxis
            type="number"
            dataKey="anomaly_votes"
            name="votes"
            domain={[0, 7]}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{ value: "이상치 votes", angle: -90, fontSize: 10, fill: "var(--text-dim)", dx: -10 }}
          />
          <ZAxis range={[18, 18]} />
          <ReferenceLine x={50} stroke="oklch(1 0 0 / 0.1)" strokeDasharray="3 3" />
          <ReferenceLine y={3.5} stroke="oklch(1 0 0 / 0.1)" strokeDasharray="3 3" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as Point;
              return (
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 text-xs">
                  <div className="font-medium">{d.corp_name}</div>
                  <div className="text-[10px] text-[var(--text-dim)] font-mono">
                    {d.corp_code}
                  </div>
                  <div className="mt-1 tabular">
                    건전성 {d.health_score.toFixed(0)} · votes {d.anomaly_votes}/7
                    {d.risk ? <span className="text-red-300"> · 위험 라벨</span> : null}
                  </div>
                </div>
              );
            }}
          />
          <Scatter name="안전" data={normal} fill="#3b82f6" fillOpacity={0.4} />
          <Scatter name="위험 라벨" data={danger} fill="#ef4444" fillOpacity={0.95} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
