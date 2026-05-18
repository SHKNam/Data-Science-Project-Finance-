"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { fmtFloat, gradeBg } from "@/lib/format";

type Metric = { key: string; label: string; digits?: number };

const COMPANY_METRICS: Metric[] = [
  { key: "health_score", label: "건전성 점수", digits: 1 },
  { key: "altman_z", label: "Altman Z", digits: 2 },
  { key: "debt_ratio", label: "부채비율 %", digits: 2 },
  { key: "current_ratio", label: "유동비율 %", digits: 2 },
  { key: "roe", label: "ROE %", digits: 2 },
  { key: "roa", label: "ROA %", digits: 2 },
  { key: "interest_coverage", label: "이자보상배율", digits: 2 },
  { key: "operating_margin", label: "영업이익률 %", digits: 2 },
];

const MODEL_METRICS: Metric[] = [
  { key: "auc_roc", label: "AUC-ROC" },
  { key: "f1", label: "F1" },
  { key: "precision", label: "Precision" },
  { key: "recall", label: "Recall" },
  { key: "accuracy", label: "Accuracy" },
  { key: "silhouette", label: "Silhouette" },
  { key: "calinski_harabasz", label: "Calinski-Harabasz" },
  { key: "davies_bouldin", label: "Davies-Bouldin" },
  { key: "n_anomalies", label: "탐지 건수" },
  { key: "anomaly_rate", label: "탐지율" },
  { key: "rmse", label: "RMSE" },
  { key: "mae", label: "MAE" },
  { key: "mape", label: "MAPE %" },
  { key: "train_time_sec", label: "학습 시간(s)" },
];

export function CompareView({
  items,
  type,
}: {
  items: Array<Record<string, unknown>>;
  type: "company" | "model";
}) {
  const metrics = type === "company" ? COMPANY_METRICS : MODEL_METRICS;
  const visibleMetrics = metrics.filter((m) => items.some((it) => it[m.key] != null));

  // Calculate diff highlight per metric
  const highlights = new Map<string, { max: number; min: number }>();
  for (const m of visibleMetrics) {
    const vals = items
      .map((it) => Number(it[m.key]))
      .filter((v) => !Number.isNaN(v));
    if (vals.length > 1) {
      const range = Math.max(...vals) - Math.min(...vals);
      if (range > 0) {
        highlights.set(m.key, { max: Math.max(...vals), min: Math.min(...vals) });
      }
    }
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface-2)]/60">
            <tr>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-semibold sticky left-0 bg-[var(--surface-2)]/60">
                지표
              </th>
              {items.map((it, i) => (
                <th key={i} className="text-right px-4 py-3 text-xs">
                  {type === "company" ? (
                    <Link
                      href={`/company/${String(it.corp_code)}`}
                      className="hover:text-[var(--primary)]"
                    >
                      <div className="font-medium">{String(it.corp_name)}</div>
                      <div className="text-[10px] text-[var(--text-dim)] font-mono mt-0.5">
                        {String(it.corp_code)}
                      </div>
                      {it.health_grade ? (
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] border ${gradeBg(String(it.health_grade))}`}
                        >
                          {String(it.health_grade)}
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    <div className="font-medium">{String(it.model)}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleMetrics.map((m) => {
              const hl = highlights.get(m.key);
              return (
                <tr key={m.key} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2 text-[var(--text-muted)] text-xs sticky left-0 bg-[var(--surface)]">
                    {m.label}
                  </td>
                  {items.map((it, i) => {
                    const v = Number(it[m.key]);
                    const isMax = hl && v === hl.max;
                    const isMin = hl && v === hl.min;
                    const fmt = Number.isNaN(v) ? "—" : fmtFloat(v, m.digits ?? 3);
                    return (
                      <td
                        key={i}
                        className={`text-right px-4 py-2 tabular ${
                          isMax ? "text-emerald-300 font-semibold" :
                          isMin ? "text-red-300" : ""
                        }`}
                      >
                        <>{fmt}</>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
