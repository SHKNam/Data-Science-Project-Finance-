import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Layers, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { NextSteps } from "@/components/next-steps";
import { KpiCard } from "@/components/kpi-card";
import { WatchlistButton } from "@/components/watchlist-button";
import { CompareButton } from "@/components/compare-button";
import { AltmanGauge } from "@/components/altman-gauge";
import { AttentionBadge } from "@/components/attention-badge";
import { RadarComparison } from "@/components/charts/radar-comparison";
import { SimilarCompanies } from "@/components/similar-companies";
import { RecentTracker } from "@/components/recent-tracker";
import { DomainTooltip } from "@/components/domain-tooltip";
import {
  loadJSON,
  type AnomalyFlag,
  type DisclosureTimeline,
  type SectorCluster,
} from "@/lib/data";
import { fmtFloat, fmtCompact, gradeBg } from "@/lib/format";

export async function generateStaticParams() {
  const sc = await loadJSON<SectorCluster[]>("sector_clusters.json");
  // 빌드 시 모든 기업 페이지 사전 생성 (옵션이지만 SEO/속도에 좋음)
  return sc.slice(0, 200).map((c) => ({ corp_code: c.corp_code }));
}

export default async function CompanyPage(
  props: { params: Promise<{ corp_code: string }> },
) {
  const { corp_code } = await props.params;
  const [sc, anomalies, timelines] = await Promise.all([
    loadJSON<SectorCluster[]>("sector_clusters.json"),
    loadJSON<AnomalyFlag[]>("anomaly_flags.json"),
    loadJSON<DisclosureTimeline>("disclosure_timelines.json"),
  ]);

  const row = sc.find((r) => r.corp_code === corp_code);
  if (!row) notFound();

  const anom = anomalies.find((a) => a.corp_code === corp_code);

  // 동일 클러스터 평균
  const clusterPeers = sc.filter((r) => r.cluster === row.cluster && r.corp_code !== corp_code);
  const clusterAvg = (key: keyof SectorCluster) =>
    clusterPeers.reduce((sum, p) => sum + Number(p[key] || 0), 0) / Math.max(clusterPeers.length, 1);

  // 유사 기업 (PCA 거리)
  const similar = clusterPeers
    .map((p) => ({
      ...p,
      distance: Math.hypot(p.pca_1 - row.pca_1, p.pca_2 - row.pca_2),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  // 레이더 (정규화)
  const radarMetrics: Array<{ key: keyof SectorCluster; label: string; reverse?: boolean }> = [
    { key: "debt_ratio", label: "부채비율", reverse: true },
    { key: "current_ratio", label: "유동비율" },
    { key: "roe", label: "ROE" },
    { key: "roa", label: "ROA" },
    { key: "interest_coverage", label: "이자보상" },
    { key: "operating_margin", label: "영업이익률" },
  ];

  const radarData = radarMetrics.map((m) => {
    const me = Number(row[m.key]) || 0;
    const avg = clusterAvg(m.key);
    const denom = Math.max(Math.abs(me), Math.abs(avg), 1);
    const youN = (me / denom) * 100;
    const clusterN = (avg / denom) * 100;
    return {
      metric: m.label,
      you: m.reverse ? 100 - youN : youN,
      cluster: m.reverse ? 100 - clusterN : clusterN,
    };
  });

  const timeline = timelines[corp_code] ?? [];

  // Attention conditions
  const attentions: Array<{ reason: string; level: "warning" | "danger" | "info" }> = [];
  if (anom && anom.anomaly_votes >= 4) {
    attentions.push({ reason: `이상치 ${anom.anomaly_votes}/7 모델 합의`, level: "danger" });
  }
  if (anom?.risk) attentions.push({ reason: "공식 위험 라벨", level: "danger" });
  if (row.health_grade === "위험") attentions.push({ reason: "건전성 위험 등급", level: "danger" });
  if (row.health_grade === "주의") attentions.push({ reason: "건전성 주의 등급", level: "warning" });
  if (row.altman_z < 1.81) attentions.push({ reason: "Altman 위험 구간", level: "warning" });

  return (
    <>
      <RecentTracker href={`/company/${corp_code}`} label={row.corp_name} kind="company" />

      <Link
        href="/phase-2"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] mb-3 transition-colors"
      >
        <ArrowLeft size={12} /> 업종 클러스터로
      </Link>

      <header className="mb-8 animate-fade-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--primary)] font-semibold">
                COMPANY
              </span>
              <span className="text-[10px] text-[var(--text-dim)] font-mono">
                {row.corp_code}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
              {row.corp_name}
            </h1>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge variant="outline">
                <MapPin size={11} /> 업종 {row.induty_code}
              </Badge>
              <Badge variant="outline">
                <Layers size={11} /> 클러스터 {row.cluster}
              </Badge>
              <Badge variant="outline">
                <Calendar size={11} /> {row.bsns_year}
              </Badge>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${gradeBg(row.health_grade)}`}>
                {row.health_grade}
              </span>
              {attentions.map((a, i) => (
                <AttentionBadge key={i} reason={a.reason} level={a.level} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WatchlistButton corp_code={corp_code} corp_name={row.corp_name} />
            <CompareButton id={corp_code} label={row.corp_name} type="company" />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="건전성 점수"
          value={fmtFloat(row.health_score, 1)}
          hint="0~100"
          accent={
            row.health_grade === "위험"
              ? "danger"
              : row.health_grade === "주의"
              ? "warning"
              : "primary"
          }
        />
        <KpiCard
          label="총자산"
          value={fmtCompact(row.total_assets ?? 0)}
          hint="KRW"
          accent="info"
        />
        <KpiCard
          label="매출액"
          value={fmtCompact(row.revenue ?? 0)}
          hint="KRW"
          accent="info"
        />
        <KpiCard
          label="이상치 votes"
          value={`${anom?.anomaly_votes ?? 0}/7`}
          hint="7개 모델 합의"
          accent={(anom?.anomaly_votes ?? 0) >= 4 ? "danger" : (anom?.anomaly_votes ?? 0) >= 2 ? "warning" : "default"}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <Card className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">동일 클러스터 평균 대비</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              클러스터 {row.cluster} 내 {clusterPeers.length}사 평균과 비교
            </p>
          </div>
          <RadarComparison data={radarData} />
        </Card>

        <Card>
          <div className="px-5 py-5">
            <AltmanGauge z={row.altman_z} />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {[
          { key: "debt_ratio", label: "부채비율", unit: "%" },
          { key: "current_ratio", label: "유동비율", unit: "%" },
          { key: "roe", label: "ROE", unit: "%" },
          { key: "roa", label: "ROA", unit: "%" },
          { key: "interest_coverage", label: "이자보상배율", unit: "x" },
          { key: "operating_margin", label: "영업이익률", unit: "%" },
        ].map((m) => {
          const you = Number(row[m.key as keyof SectorCluster]) || 0;
          const avg = clusterAvg(m.key as keyof SectorCluster);
          const diff = you - avg;
          const tooltipMap: Record<string, keyof typeof import("@/lib/domain").TERMS> = {
            debt_ratio: "debt_ratio",
            current_ratio: "current_ratio",
            roe: "roe",
            roa: "roa",
            interest_coverage: "interest_coverage",
            operating_margin: "operating_margin",
          };
          return (
            <Card key={m.key}>
              <div className="px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                  <DomainTooltip term={tooltipMap[m.key]}>{m.label}</DomainTooltip>
                </div>
                <div className="mt-1 text-xl font-semibold tabular">
                  {fmtFloat(you, 2)}
                  <span className="text-xs text-[var(--text-dim)] ml-1">{m.unit}</span>
                </div>
                <div className="mt-0.5 text-[11px] tabular">
                  <span className="text-[var(--text-dim)]">클러스터 평균 {fmtFloat(avg, 2)}</span>
                  <span className={`ml-2 ${diff > 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {diff > 0 ? "+" : ""}
                    {fmtFloat(diff, 2)}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <SimilarCompanies
          items={similar.map((s) => ({
            corp_code: s.corp_code,
            corp_name: s.corp_name,
            distance: s.distance,
            health_grade: s.health_grade,
            health_score: s.health_score,
          }))}
        />

        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="text-sm font-semibold">공시 이력</h3>
            <Badge variant="outline">{timeline.length}건</Badge>
          </div>
          {timeline.length === 0 ? (
            <div className="px-5 py-6 text-xs text-[var(--text-muted)] text-center">
              공시 이력 데이터가 없습니다.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)]">
              {timeline.slice(0, 20).map((e, i) => (
                <div key={i} className="px-5 py-2.5 flex items-start gap-3">
                  <div className="text-[10px] text-[var(--text-dim)] font-mono whitespace-nowrap pt-0.5">
                    {e.rcept_dt.substring(0, 8)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[var(--text)] truncate">{e.report_nm}</div>
                    <div className="text-[10px] text-[var(--text-dim)]">{e.report_type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <NextSteps
        steps={[
          { href: "/phase-2", title: "동일 클러스터 전체", description: `클러스터 ${row.cluster}의 모든 기업`, icon: Layers },
          { href: "/compare", title: "비교 모드", description: "비교 트레이에 추가하고 진행", icon: MapPin },
          { href: "/phase-3", title: "이상탐지 자세히", description: "anomaly_votes와 Benford로 검증", icon: MapPin },
        ]}
      />
    </>
  );
}
