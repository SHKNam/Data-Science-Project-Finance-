import Link from "next/link";
import { AlertOctagon, AlertTriangle, FileSearch, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { InsightCallout } from "@/components/insight-callout";
import { LeaderboardTable, type Column } from "@/components/leaderboard-table";
import { NextSteps } from "@/components/next-steps";
import { ChartShell } from "@/components/charts/chart-shell";
import { VotesHistogram } from "@/components/charts/votes-histogram";
import { BenfordBar } from "@/components/charts/benford-bar";
import { DomainTooltip } from "@/components/domain-tooltip";
import {
  loadJSON,
  type AnomalyFlag,
  type BenfordRow,
  type BenfordSuspicious,
  type LeaderboardP3,
} from "@/lib/data";
import { fmtFloat, fmtNumber } from "@/lib/format";

export const metadata = { title: "Phase 3 · 이상탐지 + Benford — DART Insights" };

export default async function Phase3Page() {
  const [lb, flags, benford, susp] = await Promise.all([
    loadJSON<LeaderboardP3[]>("phase3_leaderboard.json"),
    loadJSON<AnomalyFlag[]>("anomaly_flags.json"),
    loadJSON<BenfordRow[]>("phase3_benford_results.json"),
    loadJSON<BenfordSuspicious[]>("phase3_benford_suspicious.json"),
  ]);

  // votes histogram
  const histogram = Array.from({ length: 8 }, (_, v) => ({
    votes: v,
    count: flags.filter((f) => f.anomaly_votes === v).length,
  }));

  const suspCount = flags.filter((f) => f.anomaly_votes >= 4).length;
  const mediumCount = flags.filter((f) => f.anomaly_votes >= 2 && f.anomaly_votes < 4).length;

  const cols: Column<LeaderboardP3>[] = [
    { key: "model", label: "모델" },
    { key: "n_anomalies", label: "탐지 건수", align: "right", format: "int" },
    { key: "anomaly_rate", label: "비율", align: "right", format: "pct", digits: 2 },
    { key: "precision", label: "Precision", align: "right", format: "float3" },
    { key: "recall", label: "Recall", align: "right", format: "float3" },
  ];

  const topSuspicious = [...flags]
    .filter((f) => f.anomaly_votes >= 3)
    .sort((a, b) => b.anomaly_votes - a.anomaly_votes)
    .slice(0, 20);

  return (
    <>
      <PageHeader
        eyebrow="PHASE 03"
        title="이상탐지 + Benford's Law"
        description="6개 이상탐지 모델 + Autoencoder + 다수결 앙상블. 회계 분식 검증을 위한 Benford's Law 자릿수 분석."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="모델 합의 의심"
          value={suspCount}
          hint="votes ≥ 4 · 강한 의심"
          accent={suspCount > 0 ? "danger" : "default"}
          icon={ShieldAlert}
        />
        <KpiCard
          label="중간 의심"
          value={mediumCount}
          hint="votes 2~3"
          accent="warning"
          icon={AlertTriangle}
        />
        <KpiCard
          label="총 분석 기업"
          value={fmtNumber(flags.length)}
          hint="2023년"
        />
        <KpiCard
          label="앙상블 모델"
          value={lb.length + 2}
          hint="6 + AE + 앙상블"
        />
      </section>

      <section className="mb-6">
        <InsightCallout variant="warning">
          7개 모델 중 <b>4개 이상이 동일 기업을 이상치로 지목한 경우</b>가
          <b> {suspCount}건</b>입니다. 모든 모델이 비지도 학습이므로 ground truth
          precision은 알 수 없지만, 합의도가 높을수록 추가 조사 우선순위가
          올라갑니다. 아래 Benford 분석과 교차하면 회계상 이상 패턴까지 검증
          가능합니다.
        </InsightCallout>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <ChartShell
          title={"이상치 votes 히스토그램"}
          description="0=정상 합의, 7=모든 모델이 이상으로 판단"
        >
          <VotesHistogram data={histogram} />
        </ChartShell>

        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">
              7개 모델 리더보드 · <DomainTooltip term="anomaly_votes">votes 합의 기반</DomainTooltip>
            </h3>
          </div>
          <div className="p-3">
            <LeaderboardTable data={lb} columns={cols} defaultSort="n_anomalies" highlightTop={false} />
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <AlertOctagon size={14} className="text-red-400" />
            <h3 className="text-sm font-semibold">이상치 의심 기업 (votes ≥ 3)</h3>
            <Badge variant="danger" className="ml-auto">{topSuspicious.length}건</Badge>
          </div>
          {topSuspicious.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
              합의도 3 이상 의심 기업이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-2)]/60 text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                  <tr>
                    <th className="text-left px-4 py-2">기업</th>
                    <th className="text-right px-4 py-2">corp_code</th>
                    <th className="text-right px-4 py-2">Votes</th>
                    <th className="text-right px-4 py-2">위험 라벨</th>
                  </tr>
                </thead>
                <tbody>
                  {topSuspicious.map((r) => (
                    <tr key={r.corp_code} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition-colors">
                      <td className="px-4 py-2">
                        <Link href={`/company/${r.corp_code}`} className="hover:text-[var(--primary)]">
                          {r.corp_name}
                        </Link>
                      </td>
                      <td className="text-right px-4 py-2 font-mono text-[10px] text-[var(--text-dim)]">
                        {r.corp_code}
                      </td>
                      <td className="text-right px-4 py-2 tabular">
                        <span className={`inline-block px-2 py-0.5 rounded ${r.anomaly_votes >= 4 ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"}`}>
                          {r.anomaly_votes} / 7
                        </span>
                      </td>
                      <td className="text-right px-4 py-2">
                        {r.risk ? <Badge variant="danger">위험</Badge> : <span className="text-[var(--text-dim)]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <section className="mb-6">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <FileSearch size={14} className="text-amber-400" />
            <h3 className="text-sm font-semibold">
              <DomainTooltip term="benford">Benford&apos;s Law</DomainTooltip> 자릿수 분포 검증
            </h3>
            <span className="text-[11px] text-[var(--text-dim)] ml-2">
              4개 재무 컬럼의 첫째 자릿수 분포 vs Benford 기대값
            </span>
          </div>
          <div className="p-3">
            <BenfordBar rows={benford} />
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">Benford KL Divergence 상위 의심</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              자릿수 분포가 Benford 기대값과 가장 멀리 떨어진 기업 Top 20
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)]/60 text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                <tr>
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">기업</th>
                  <th className="text-right px-4 py-2">KL divergence</th>
                </tr>
              </thead>
              <tbody>
                {susp.slice(0, 20).map((r, i) => (
                  <tr key={r.corp_code} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition-colors">
                    <td className="px-4 py-2 text-[var(--text-dim)]">{i + 1}</td>
                    <td className="px-4 py-2">
                      <Link href={`/company/${r.corp_code}`} className="hover:text-[var(--primary)]">
                        {r.corp_name}
                      </Link>
                      <div className="text-[10px] text-[var(--text-dim)] font-mono">
                        {r.corp_code}
                      </div>
                    </td>
                    <td className="text-right px-4 py-2 tabular">
                      {fmtFloat(r.kl_divergence, 4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <NextSteps
        steps={[
          { href: "/phase-4", title: "Phase 4 시계열", description: "공시 추세 분석", icon: AlertTriangle },
          { href: "/cross-phase", title: "교차 분석", description: "위험·이상치·클러스터", icon: AlertTriangle },
          { href: "/guides/find-risky-companies", title: "위험 기업 발굴 가이드", description: "단계별 워크플로우", icon: ShieldAlert },
        ]}
      />
    </>
  );
}
