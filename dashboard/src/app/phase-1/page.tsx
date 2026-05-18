import { Activity, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { InsightCallout } from "@/components/insight-callout";
import { LeaderboardTable, type Column } from "@/components/leaderboard-table";
import { NextSteps } from "@/components/next-steps";
import { ChartShell } from "@/components/charts/chart-shell";
import { MetricBar } from "@/components/charts/metric-bar";
import { RocPrChart } from "@/components/charts/roc-pr-chart";
import { ConfusionMatrix } from "@/components/charts/confusion-matrix";
import { LearningCurve } from "@/components/charts/learning-curve";
import { DomainTooltip } from "@/components/domain-tooltip";
import {
  loadJSON,
  type HealthScore,
  type LeaderboardP1,
} from "@/lib/data";
import { fmtFloat, gradeBg } from "@/lib/format";

export const metadata = { title: "Phase 1 · 재무건전성 분류 — DART Insights" };

export default async function Phase1Page() {
  const [lb, hs, roc, pr, conf, lc] = await Promise.all([
    loadJSON<LeaderboardP1[]>("phase1_leaderboard.json"),
    loadJSON<HealthScore[]>("health_scores.json"),
    loadJSON<Record<string, { fpr: number[]; tpr: number[] }>>(
      "phase1_roc_curves.json",
    ),
    loadJSON<Record<string, { precision: number[]; recall: number[] }>>(
      "phase1_pr_curves.json",
    ),
    loadJSON<Record<string, { tp: number; fp: number; fn: number; tn: number }>>(
      "phase1_confusion_matrices.json",
    ),
    loadJSON<Record<string, number[]>>("phase1_learning_curves.json"),
  ]);

  const bestAUC = [...lb].sort((a, b) => (b.auc_roc || 0) - (a.auc_roc || 0))[0];
  const bestF1 = [...lb].sort((a, b) => (b.f1 || 0) - (a.f1 || 0))[0];
  const avgTime =
    lb.reduce((s, m) => s + (m.train_time_sec || 0), 0) / lb.length;

  const grades = ["우량", "보통", "주의", "위험"].map((g) => ({
    grade: g,
    n: hs.filter((h) => h.health_grade === g).length,
  }));

  const cols: Column<LeaderboardP1>[] = [
    { key: "model", label: "모델" },
    { key: "auc_roc", label: "AUC", align: "right", format: "float3" },
    { key: "f1", label: "F1", align: "right", format: "float3" },
    { key: "precision", label: "Precision", align: "right", format: "float3" },
    { key: "recall", label: "Recall", align: "right", format: "float3" },
    { key: "accuracy", label: "Accuracy", align: "right", format: "float3" },
    { key: "train_time_sec", label: "시간(s)", align: "right", format: "time" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="PHASE 01"
        title="재무건전성 분류"
        description="16개 분류 모델로 위험 기업 vs 안전 기업 식별. 70/15/15 split + StratifiedKFold 5-fold + SMOTE."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="최고 AUC"
          value={fmtFloat(bestAUC?.auc_roc ?? 0, 3)}
          hint={bestAUC?.model}
          accent="primary"
          icon={Activity}
        />
        <KpiCard
          label="최고 F1"
          value={fmtFloat(bestF1?.f1 ?? 0, 3)}
          hint={bestF1?.model}
          accent="info"
        />
        <KpiCard
          label="모델 수"
          value={lb.length}
          hint="sklearn 11 + DL 3 + 앙상블 2"
        />
        <KpiCard
          label="평균 학습시간"
          value={`${fmtFloat(avgTime, 1)}s`}
          hint="모델당 평균"
        />
      </section>

      <section className="mb-6">
        <InsightCallout variant="warning" title="왜 F1이 낮은가?">
          전체 791사 중 실제 위험(부도/회생/거래정지) 기업이{" "}
          <b>{hs.filter((h) => h.health_grade === "위험").length}사</b>로 약 1.8%에
          불과한 극심한 클래스 불균형 때문입니다. AUC-ROC가 0.5~0.7 구간인 것은
          모델이 무작위보다는 낫지만 운영 수준은 아니라는 뜻 — 양성 샘플 보강
          또는 다른 라벨 전략이 필요합니다.
        </InsightCallout>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <Card className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">16개 모델 리더보드</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              컬럼 헤더 클릭으로 정렬
            </p>
          </div>
          <div className="p-3">
            <LeaderboardTable data={lb} columns={cols} defaultSort="auc_roc" />
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <Users size={14} />
            <h3 className="text-sm font-semibold">건전성 등급 분포</h3>
          </div>
          <div className="p-4 space-y-2">
            {grades.map((g) => {
              const pct = (g.n / hs.length) * 100;
              return (
                <div key={g.grade}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${gradeBg(g.grade)}`}>
                      {g.grade}
                    </span>
                    <span className="text-xs tabular text-[var(--text-muted)]">
                      {g.n} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--info)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <ChartShell title="모델별 메트릭 비교" description="AUC / F1 / Precision / Recall">
          <MetricBar
            data={lb.map((r) => ({
              model: r.model,
              AUC: r.auc_roc ?? 0,
              F1: r.f1 ?? 0,
              Precision: r.precision ?? 0,
              Recall: r.recall ?? 0,
            }))}
            xKey="model"
            bars={[
              { key: "AUC", label: "AUC", color: "var(--chart-1)" },
              { key: "F1", label: "F1", color: "var(--chart-2)" },
              { key: "Precision", label: "Precision", color: "var(--chart-3)" },
              { key: "Recall", label: "Recall", color: "var(--chart-4)" },
            ]}
            height={360}
          />
        </ChartShell>
      </section>

      <section className="mb-6">
        <Tabs defaultValue="roc">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              <DomainTooltip term="auc_roc">곡선 비교</DomainTooltip>
            </h2>
            <TabsList>
              <TabsTrigger value="roc">ROC</TabsTrigger>
              <TabsTrigger value="pr">PR</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="roc">
            <Card>
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold">ROC Curve</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  대각선은 무작위 분류기. 좌상단에 가까울수록 좋음.
                </p>
              </div>
              <div className="p-4">
                <RocPrChart data={roc} type="roc" />
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="pr">
            <Card>
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold">Precision-Recall Curve</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  불균형 데이터에서 ROC보다 유용. 우상단에 가까울수록 좋음.
                </p>
              </div>
              <div className="p-4">
                <RocPrChart data={pr} type="pr" />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <ChartShell title="혼동행렬" description="모델별 TP/FP/FN/TN">
          <ConfusionMatrix data={conf} />
        </ChartShell>
        {Object.keys(lc).length > 0 && (
          <ChartShell
            title="PyTorch 학습 곡선"
            description="에폭별 BCE Loss"
          >
            <LearningCurve data={lc} />
          </ChartShell>
        )}
      </section>

      <NextSteps
        steps={[
          { href: "/phase-2", title: "Phase 2 클러스터", description: "기업 그룹화 비지도 학습", icon: Activity },
          { href: "/cross-phase", title: "교차 분석", description: "위험·이상치·클러스터 흐름", icon: Activity },
          { href: "/models", title: "모델 카탈로그", description: "구현 파일과 하이퍼파라미터", icon: Activity },
        ]}
      />
    </>
  );
}
