import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Building2,
  Layers,
  LineChart,
  Presentation,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { KpiCard } from "@/components/kpi-card";
import { InsightCallout } from "@/components/insight-callout";
import { NextSteps } from "@/components/next-steps";
import { PageHeader } from "@/components/page-header";
import {
  loadJSON,
  type AnomalyFlag,
  type CrossPhaseSummary,
  type HealthScore,
  type LeaderboardP1,
  type LeaderboardP2,
  type LeaderboardP4,
  type Meta,
} from "@/lib/data";
import { fmtFloat, fmtNumber, gradeBg } from "@/lib/format";

export const metadata = { title: "Executive Summary · DART Insights" };

export default async function SummaryPage() {
  const [meta, p1, p2, p4, anomalies, hs, cross] = await Promise.all([
    loadJSON<Meta>("meta.json"),
    loadJSON<LeaderboardP1[]>("phase1_leaderboard.json"),
    loadJSON<LeaderboardP2[]>("phase2_leaderboard.json"),
    loadJSON<LeaderboardP4[]>("phase4_leaderboard.json"),
    loadJSON<AnomalyFlag[]>("anomaly_flags.json"),
    loadJSON<HealthScore[]>("health_scores.json"),
    loadJSON<CrossPhaseSummary>("cross_phase_summary.json"),
  ]);

  const bestP1 = [...p1].sort((a, b) => (b.auc_roc || 0) - (a.auc_roc || 0))[0];
  const bestP2 = [...p2].sort((a, b) => (b.silhouette || 0) - (a.silhouette || 0))[0];
  const bestP4 = [...p4].sort((a, b) => (a.rmse || Infinity) - (b.rmse || Infinity))[0];

  // Top 5 risky companies
  const topRisky = [...hs]
    .sort((a, b) => (a.health_score || 0) - (b.health_score || 0))
    .slice(0, 5);

  // Top 5 by anomaly votes
  const topSuspicious = [...anomalies]
    .sort((a, b) => (b.anomaly_votes || 0) - (a.anomaly_votes || 0))
    .slice(0, 5);

  const grades = ["우량", "보통", "주의", "위험"].map((g) => ({
    g,
    n: hs.filter((h) => h.health_grade === g).length,
  }));

  return (
    <>
      <PageHeader
        eyebrow="EXECUTIVE SUMMARY"
        title="한 페이지 요약"
        description="DART 데이터 사이언스 프로젝트의 모든 핵심 결과 — 4개 페이즈 KPI + 자동 인사이트 + 위험·이상 Top 5를 한 화면에서."
        actions={
          <>
            <Link href="/present">
              <Button variant="primary" size="sm">
                <Presentation size={14} /> 발표 모드
              </Button>
            </Link>
            <PrintButton />
          </>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiCard label="분석 기업" value={fmtNumber(meta.n_companies)} icon={Building2} accent="info" />
        <KpiCard
          label="Phase 1 · 최고 AUC"
          value={fmtFloat(bestP1?.auc_roc ?? 0, 3)}
          hint={bestP1?.model}
          icon={Activity}
          accent="primary"
        />
        <KpiCard
          label="Phase 2 · Silhouette"
          value={fmtFloat(bestP2?.silhouette ?? 0, 3)}
          hint={bestP2?.model}
          icon={Layers}
          accent="primary"
        />
        <KpiCard
          label="Phase 4 · 최저 RMSE"
          value={fmtFloat(bestP4?.rmse ?? 0, 0)}
          hint={bestP4?.model}
          icon={LineChart}
          accent="info"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
        {cross.insights.map((insight, i) => (
          <InsightCallout
            key={i}
            title={`핵심 발견 ${i + 1}`}
            variant={i === 0 ? "warning" : i === 1 ? "default" : "info"}
          >
            {insight}
          </InsightCallout>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400" />
            <h3 className="text-sm font-semibold">건전성 하위 Top 5</h3>
            <Badge variant="danger" className="ml-auto">위험</Badge>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-[var(--text-dim)] tracking-wider">
              <tr>
                <th className="text-left px-4 py-2">기업</th>
                <th className="text-right px-4 py-2">건전성</th>
                <th className="text-right px-4 py-2">Altman</th>
                <th className="text-right px-4 py-2">등급</th>
              </tr>
            </thead>
            <tbody>
              {topRisky.map((r) => (
                <tr key={r.corp_code} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2">
                    <Link href={`/company/${r.corp_code}`} className="hover:text-[var(--primary)]">
                      {r.corp_name}
                    </Link>
                    <div className="text-[10px] text-[var(--text-dim)] font-mono">
                      {r.corp_code}
                    </div>
                  </td>
                  <td className="text-right tabular px-4 py-2">
                    {fmtFloat(r.health_score, 1)}
                  </td>
                  <td className="text-right tabular px-4 py-2">
                    {fmtFloat(r.altman_z, 2)}
                  </td>
                  <td className="text-right px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 text-[11px] rounded-full border ${gradeBg(r.health_grade)}`}>
                      {r.health_grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <h3 className="text-sm font-semibold">이상치 합의 Top 5</h3>
            <Badge variant="warning" className="ml-auto">votes</Badge>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-[var(--text-dim)] tracking-wider">
              <tr>
                <th className="text-left px-4 py-2">기업</th>
                <th className="text-right px-4 py-2">Votes</th>
                <th className="text-right px-4 py-2">위험 라벨</th>
              </tr>
            </thead>
            <tbody>
              {topSuspicious.map((r) => (
                <tr key={r.corp_code} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2">
                    <Link href={`/company/${r.corp_code}`} className="hover:text-[var(--primary)]">
                      {r.corp_name}
                    </Link>
                    <div className="text-[10px] text-[var(--text-dim)] font-mono">
                      {r.corp_code}
                    </div>
                  </td>
                  <td className="text-right tabular px-4 py-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-amber-300">{r.anomaly_votes}</span>
                      <span className="text-[var(--text-dim)]">/ 7</span>
                    </span>
                  </td>
                  <td className="text-right px-4 py-2">
                    {r.risk ? (
                      <Badge variant="danger">위험</Badge>
                    ) : (
                      <span className="text-[var(--text-dim)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <h3 className="text-sm font-semibold">건전성 등급 분포</h3>
            <span className="text-[10px] text-[var(--text-dim)] ml-2 tabular">
              총 {hs.length}사
            </span>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {grades.map((g) => (
              <div key={g.g} className="text-center">
                <div className={`inline-block mb-2 px-3 py-1 rounded-full border text-xs ${gradeBg(g.g)}`}>
                  {g.g}
                </div>
                <div className="text-2xl font-semibold tabular">{fmtNumber(g.n)}</div>
                <div className="text-[11px] text-[var(--text-dim)] tabular">
                  {((g.n / hs.length) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <NextSteps
        steps={[
          { href: "/cross-phase", title: "교차 분석 자세히", description: "Sankey와 4분면 산점도", icon: Sparkles },
          { href: "/phase-1", title: "Phase 1 깊이 보기", description: "16개 모델 비교·SHAP·ROC", icon: Activity },
          { href: "/guides", title: "시나리오 가이드", description: "역할별 워크플로우 6종", icon: Presentation },
        ]}
      />
    </>
  );
}
