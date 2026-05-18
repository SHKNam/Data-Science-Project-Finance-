export function AltmanGauge({ z }: { z: number }) {
  const min = -2;
  const max = 8;
  const clamped = Math.max(min, Math.min(max, z));
  const pct = ((clamped - min) / (max - min)) * 100;

  const zone = z < 1.81 ? "위험" : z < 2.99 ? "회색" : "안전";
  const zoneColor =
    z < 1.81 ? "text-red-300" : z < 2.99 ? "text-amber-300" : "text-emerald-300";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
          Altman Z-Score
        </span>
        <span className={`text-xs font-medium ${zoneColor}`}>{zone}</span>
      </div>
      <div className="text-2xl font-semibold tabular">{z.toFixed(2)}</div>
      <div className="relative h-2.5 mt-3 rounded-full overflow-hidden bg-[var(--surface-2)]">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400"
          style={{
            width: "100%",
            opacity: 0.4,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white shadow-lg rounded-sm"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-[var(--text-dim)] tabular">
        <span>위험 &lt;1.81</span>
        <span>회색 1.81~2.99</span>
        <span>안전 &gt;2.99</span>
      </div>
    </div>
  );
}
