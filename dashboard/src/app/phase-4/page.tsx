import { Activity, LineChart, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { InsightCallout } from "@/components/insight-callout";
import { LeaderboardTable, type Column } from "@/components/leaderboard-table";
import { NextSteps } from "@/components/next-steps";
import { ChartShell } from "@/components/charts/chart-shell";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { DecompositionChart } from "@/components/charts/decomposition-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import {
  loadJSON,
  type Decomposition,
  type DisclosureMonthly,
  type DisclosureSummary,
  type Forecast,
  type LeaderboardP4,
} from "@/lib/data";
import { fmtFloat, fmtNumber } from "@/lib/format";

export const metadata = { title: "Phase 4 · 공시 시계열 — DART Insights" };

export default async function Phase4Page() {
  const [lb, monthly, forecasts, decomp, summary] = await Promise.all([
    loadJSON<LeaderboardP4[]>("phase4_leaderboard.json"),
    loadJSON<DisclosureMonthly[]>("disclosure_monthly.json"),
    loadJSON<Forecast[]>("phase4_forecasts.json"),
    loadJSON<Decomposition[]>("phase4_decomposition.json"),
    loadJSON<DisclosureSummary>("disclosure_summary.json"),
  ]);

  const bestRmse = [...lb].sort((a, b) => (a.rmse || Infinity) - (b.rmse || Infinity))[0];
  const bestMae = [...lb].sort((a, b) => (a.mae || Infinity) - (b.mae || Infinity))[0];

  const cols: Column<LeaderboardP4>[] = [
    { key: "model", label: "모델" },
    { key: "rmse", label: "RMSE", align: "right", format: "float2" },
    { key: "mae", label: "MAE", align: "right", format: "float2" },
    { key: "mape", label: "MAPE %", align: "right", format: "float2" },
    { key: "train_time_sec", label: "시간(s)", align: "right", format: "time" },
  ];

  const reportTypeData = Object.entries(summary.by_report_type)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader
        eyebrow="PHASE 04"
        title="공시 시계열 분석"
        description="5개 시계열 모델(ARIMA·Prophet·LSTM·GRU·Transformer)로 월별 공시 건수 예측. 30개월 학습 / 6개월 테스트."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="총 공시"
          value={fmtNumber(summary.total)}
          hint="2023-01 ~ 2025-12"
          accent="info"
          icon={LineChart}
        />
        <KpiCard
          label="최저 RMSE"
          value={fmtFloat(bestRmse?.rmse ?? 0, 0)}
          hint={bestRmse?.model}
          accent="primary"
          icon={TrendingDown}
        />
        <KpiCard
          label="최저 MAE"
          value={fmtFloat(bestMae?.mae ?? 0, 0)}
          hint={bestMae?.model}
          accent="primary"
        />
        <KpiCard
          label="월별 데이터 포인트"
          value={monthly.length}
          hint="36개월"
        />
      </section>

      <section className="mb-6">
        <InsightCallout variant="info">
          월별 공시 건수가 평소 100~75 수준에서 분기 말(3·9·12월)에{" "}
          <b>9,800~10,000건</b>으로 급증하는 강한 분기 계절성을 보입니다. 이런
          극단적 bimodal 패턴 때문에 ARIMA가 가장 잘 적합되며, Prophet은 연
          주기가 충분히 학습되지 않습니다.
        </InsightCallout>
      </section>

      <section className="mb-6">
        <ChartShell
          title="월별 공시 추이 + 5개 모델 예측 오버레이"
          description="2025-07 ~ 2025-12 테스트 구간에서 각 모델의 예측을 점선으로 표시"
        >
          <ForecastChart history={monthly} forecasts={forecasts} />
        </ChartShell>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <Card className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">시계열 분해 (Additive)</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              statsmodels seasonal_decompose, period=12
            </p>
          </div>
          <div className="px-3 py-3">
            <DecompositionChart data={decomp} />
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">보고서 유형 분포</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              상위 {Math.min(8, reportTypeData.length)}종
            </p>
          </div>
          <DonutChart data={reportTypeData.slice(0, 8)} />
          <div className="px-4 pb-4 space-y-1">
            {reportTypeData.slice(0, 8).map((r, i) => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#fb7185"][i],
                    }}
                  />
                  <span className="text-[var(--text-muted)]">{r.name}</span>
                </span>
                <span className="tabular">{fmtNumber(r.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">5개 모델 리더보드 · RMSE / MAE / MAPE</h3>
          </div>
          <div className="p-3">
            <LeaderboardTable data={lb} columns={cols} defaultSort="rmse" ascending />
          </div>
        </Card>
      </section>

      <NextSteps
        steps={[
          { href: "/cross-phase", title: "교차 분석", description: "Phase 4와 다른 페이즈 연결", icon: Activity },
          { href: "/models", title: "시계열 모델 상세", description: "각 모델의 하이퍼파라미터", icon: TrendingUp },
          { href: "/validation", title: "검증 방법론", description: "forward chaining 30/6", icon: LineChart },
        ]}
      />
    </>
  );
}
