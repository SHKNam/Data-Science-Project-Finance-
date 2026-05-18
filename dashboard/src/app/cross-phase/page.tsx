import { Network, Sparkles, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { InsightCallout } from "@/components/insight-callout";
import { NextSteps } from "@/components/next-steps";
import { ChartShell } from "@/components/charts/chart-shell";
import { QuadrantScatter } from "@/components/charts/quadrant-scatter";
import { SankeyChart } from "@/components/charts/sankey-chart";
import {
  loadJSON,
  type CrossPhaseRow,
  type CrossPhaseSummary,
} from "@/lib/data";
import { fmtNumber, gradeBg } from "@/lib/format";

export const metadata = { title: "Cross-phase 교차 분석 · DART Insights" };

export default async function CrossPhasePage() {
  const [data, summary] = await Promise.all([
    loadJSON<CrossPhaseRow[]>("cross_phase_data.json"),
    loadJSON<CrossPhaseSummary>("cross_phase_summary.json"),
  ]);

  const totalRisk = data.filter((d) => d.risk === 1).length;
  const totalSusp = data.filter((d) => d.anomaly_votes >= 4).length;
  const intersection = data.filter((d) => d.risk === 1 && d.anomaly_votes >= 3).length;

  // Cluster summary
  const byCluster = (() => {
    const map = new Map<number, { n: number; sumV: number; sumH: number; nRisk: number }>();
    for (const r of data) {
      const c = r.cluster;
      const cur = map.get(c) ?? { n: 0, sumV: 0, sumH: 0, nRisk: 0 };
      cur.n += 1;
      cur.sumV += r.anomaly_votes;
      cur.sumH += r.health_score;
      cur.nRisk += r.risk;
      map.set(c, cur);
    }
    return Array.from(map.entries())
      .map(([c, v]) => ({
        cluster: c,
        n: v.n,
        avgVotes: v.sumV / v.n,
        avgHealth: v.sumH / v.n,
        nRisk: v.nRisk,
      }))
      .sort((a, b) => b.avgVotes - a.avgVotes);
  })();

  // Grade × cluster stack
  const grades = ["우량", "보통", "주의", "위험"];
  const byGradeCluster = (() => {
    const m = new Map<string, Record<string, number>>();
    for (const r of data) {
      const k = String(r.cluster);
      const cur = m.get(k) ?? { cluster: r.cluster };
      cur[r.health_grade] = (cur[r.health_grade] as number || 0) + 1;
      m.set(k, cur);
    }
    return Array.from(m.values());
  })();

  return (
    <>
      <PageHeader
        eyebrow="CROSS-PHASE"
        title="교차 분석"
        description="위험 라벨 × 이상치 votes × 클러스터 × 건전성 등급. 페이즈 결과를 corp_code로 조인해 다각도로 봅니다."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="공식 위험 라벨"
          value={fmtNumber(totalRisk)}
          hint="부도/회생/거래정지"
          accent="danger"
        />
        <KpiCard
          label="이상치 강한 의심"
          value={fmtNumber(totalSusp)}
          hint="votes ≥ 4"
          accent="warning"
        />
        <KpiCard
          label="교집합"
          value={fmtNumber(intersection)}
          hint="둘 다 해당"
          accent="danger"
          icon={Network}
        />
        <KpiCard
          label="클러스터 수"
          value={byCluster.length}
          hint="활성 클러스터"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        {summary.insights.map((insight, i) => (
          <InsightCallout
            key={i}
            title={`발견 ${i + 1}`}
            variant={i === 0 ? "warning" : i === 1 ? "default" : "info"}
          >
            {insight}
          </InsightCallout>
        ))}
      </section>

      <section className="mb-6">
        <ChartShell
          title="등급 → 클러스터 → 이상치 흐름 (Sankey)"
          description="기업이 건전성 등급에서 어떤 클러스터로, 그리고 어떤 이상치 그룹으로 흘러가는지"
        >
          <SankeyChart nodes={summary.sankey.nodes} links={summary.sankey.links} />
        </ChartShell>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <ChartShell
          title="위험 라벨 × 이상치 votes 산점도"
          description="실제 위험 기업은 빨간색. 우상단(낮은 건전성+높은 votes)에 위험이 몰리는지 확인"
        >
          <QuadrantScatter
            data={data.map((d) => ({
              corp_code: d.corp_code,
              corp_name: d.corp_name,
              health_score: d.health_score,
              anomaly_votes: d.anomaly_votes,
              risk: d.risk,
            }))}
          />
        </ChartShell>

        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <h3 className="text-sm font-semibold">클러스터별 평균 이상치 votes</h3>
          </div>
          <div className="p-4 space-y-2">
            {byCluster.map((c) => (
              <div key={c.cluster}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm tabular">클러스터 {c.cluster}</span>
                  <span className="text-xs tabular text-[var(--text-muted)]">
                    n={c.n} · 위험 {c.nRisk}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                    style={{ width: `${(c.avgVotes / 7) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-[var(--text-dim)] tabular mt-0.5">
                  평균 votes {c.avgVotes.toFixed(2)} / 7
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <Users size={14} />
            <h3 className="text-sm font-semibold">클러스터 × 건전성 등급</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)]/60 text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                <tr>
                  <th className="text-left px-4 py-2">클러스터</th>
                  {grades.map((g) => (
                    <th key={g} className="text-right px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${gradeBg(g)}`}>
                        {g}
                      </span>
                    </th>
                  ))}
                  <th className="text-right px-4 py-2">합계</th>
                </tr>
              </thead>
              <tbody>
                {byGradeCluster.map((row) => {
                  const total = grades.reduce((s, g) => s + (Number(row[g]) || 0), 0);
                  return (
                    <tr key={String(row.cluster)} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2 tabular">클러스터 {row.cluster}</td>
                      {grades.map((g) => (
                        <td key={g} className="text-right px-4 py-2 tabular">
                          {fmtNumber(Number(row[g]) || 0)}
                        </td>
                      ))}
                      <td className="text-right px-4 py-2 tabular text-[var(--text-muted)]">
                        {fmtNumber(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <NextSteps
        steps={[
          { href: "/phase-3", title: "Phase 3 자세히", description: "이상치 votes 히스토그램", icon: TrendingUp },
          { href: "/guides/find-risky-companies", title: "위험 기업 발굴 가이드", description: "단계별 워크플로우", icon: Network },
          { href: "/watchlist", title: "워치리스트", description: "주목한 기업 모아 보기", icon: Network },
        ]}
      />
    </>
  );
}
