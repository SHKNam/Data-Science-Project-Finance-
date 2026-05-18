"use client";

type Payload = {
  name?: string;
  value?: number | string;
  color?: string;
};

export function DarkTooltip(props: { active?: boolean; payload?: Payload[]; label?: string | number }) {
  const { active, payload, label } = props;
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm px-3 py-2 text-xs shadow-xl">
      {label !== undefined && (
        <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-1">
          {label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 tabular">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: p.color as string }}
            />
            <span className="text-[var(--text-muted)]">{p.name}</span>
            <span className="ml-auto font-mono">
              {typeof p.value === "number"
                ? p.value.toLocaleString("ko-KR", {
                    maximumFractionDigits: 3,
                  })
                : String(p.value ?? "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
