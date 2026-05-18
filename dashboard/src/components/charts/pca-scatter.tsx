"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

const CLUSTER_COLORS = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#fb7185"];

type Point = {
  corp_code: string;
  corp_name: string;
  pca_1: number;
  pca_2: number;
  cluster: number;
  health_grade?: string;
};

export function PcaScatter({
  data,
  highlight,
}: {
  data: Point[];
  highlight?: string;
}) {
  const router = useRouter();
  const byCluster = data.reduce<Record<number, Point[]>>((acc, p) => {
    (acc[p.cluster] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="h-[480px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
          <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
          <XAxis
            type="number"
            dataKey="pca_1"
            name="PC1"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="pca_2"
            name="PC2"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis range={[20, 20]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload[0]) return null;
              const d = payload[0].payload as Point;
              return (
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 text-xs">
                  <div className="font-medium">{d.corp_name}</div>
                  <div className="text-[10px] text-[var(--text-dim)] font-mono">
                    {d.corp_code}
                  </div>
                  <div className="mt-1 text-[var(--text-muted)]">
                    클러스터 {d.cluster}{d.health_grade ? ` · ${d.health_grade}` : ""}
                  </div>
                  <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
                    클릭하여 상세보기
                  </div>
                </div>
              );
            }}
          />
          {Object.entries(byCluster).map(([c, pts]) => (
            <Scatter
              key={c}
              name={`Cluster ${c}`}
              data={pts}
              fill={CLUSTER_COLORS[Number(c) % CLUSTER_COLORS.length]}
              fillOpacity={0.7}
              onClick={(e: { payload?: Point }) => {
                const p = e?.payload;
                if (p?.corp_code) router.push(`/company/${p.corp_code}`);
              }}
              style={{ cursor: "pointer" }}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
