"use client";

import { useState } from "react";

type ConfusionData = Record<string, { tp: number; fp: number; fn: number; tn: number }>;

export function ConfusionMatrix({ data }: { data: ConfusionData }) {
  const models = Object.keys(data);
  const [model, setModel] = useState(models[0] ?? "");
  const cm = data[model];
  if (!cm) return null;

  const total = cm.tp + cm.fp + cm.fn + cm.tn;
  const max = Math.max(cm.tp, cm.fp, cm.fn, cm.tn, 1);

  const cell = (label: string, value: number, accent: string) => {
    const intensity = value / max;
    return (
      <div
        className={`rounded-md p-4 flex flex-col items-center justify-center border ${accent}`}
        style={{
          background: `oklch(0.72 0.18 165 / ${intensity * 0.18})`,
        }}
      >
        <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular">{value}</div>
        <div className="text-[10px] text-[var(--text-dim)] tabular">
          {((value / total) * 100).toFixed(1)}%
        </div>
      </div>
    );
  };

  return (
    <div className="px-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-[var(--text-muted)]">모델:</span>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1 text-xs"
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-xs">
        <div />
        <div className="text-center text-[10px] text-[var(--text-dim)] uppercase tracking-wider">
          예측: 안전
        </div>
        <div className="text-center text-[10px] text-[var(--text-dim)] uppercase tracking-wider">
          예측: 위험
        </div>
        <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider flex items-center">
          실제: 안전
        </div>
        {cell("TN", cm.tn, "border-emerald-500/20")}
        {cell("FP", cm.fp, "border-amber-500/20")}
        <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider flex items-center">
          실제: 위험
        </div>
        {cell("FN", cm.fn, "border-amber-500/20")}
        {cell("TP", cm.tp, "border-emerald-500/20")}
      </div>
    </div>
  );
}
