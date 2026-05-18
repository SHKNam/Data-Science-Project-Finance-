"use client";

import {
  Sankey,
  Tooltip,
  Layer,
  Rectangle,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#fb7185"];

export function SankeyChart({
  nodes,
  links,
}: {
  nodes: Array<{ name: string }>;
  links: Array<{ source: number; target: number; value: number }>;
}) {
  return (
    <div className="h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={{ nodes, links }}
          node={<CustomNode />}
          link={{ stroke: "oklch(1 0 0 / 0.1)", strokeOpacity: 0.5 }}
          nodePadding={20}
          margin={{ top: 12, right: 100, bottom: 12, left: 12 }}
        >
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const p = payload[0].payload as { name?: string; value?: number; source?: { name: string }; target?: { name: string } };
              return (
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 text-xs">
                  {p.source && p.target ? (
                    <div className="tabular">
                      {p.source.name} → {p.target.name}: <b>{p.value}</b>
                    </div>
                  ) : (
                    <div>
                      <div>{p.name}</div>
                      {p.value != null && <div className="tabular">{p.value}</div>}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}

type NodeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: { name?: string; value?: number };
};

function CustomNode(props: NodeProps) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, payload = {} } = props;
  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={COLORS[index % COLORS.length]}
        fillOpacity={0.85}
      />
      <text
        x={x + width + 6}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={10}
        fill="var(--text-muted)"
      >
        {payload.name}
      </text>
    </Layer>
  );
}
