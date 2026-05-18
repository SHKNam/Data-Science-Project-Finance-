import Link from "next/link";
import { Crown, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { InsightCallout } from "@/components/insight-callout";
import { LeaderboardTable, type Column } from "@/components/leaderboard-table";
import { NextSteps } from "@/components/next-steps";
import { ChartShell } from "@/components/charts/chart-shell";
import { PcaScatter } from "@/components/charts/pca-scatter";
import { DomainTooltip } from "@/components/domain-tooltip";
import {
  loadJSON,
  type ClusterLabels,
  type LeaderboardP2,
  type SectorCluster,
} from "@/lib/data";
import { fmtFloat, gradeBg } from "@/lib/format";

export const metadata = { title: "Phase 2 · 업종 클러스터 — DART Insights" };

export default async function Phase2Page() {
  const [lb, sc, labels] = await Promise.all([
    loadJSON<LeaderboardP2[]>("phase2_leaderboard.json"),
    loadJSON<SectorCluster[]>("sector_clusters.json"),
    loadJSON<ClusterLabels>("phase2_cluster_labels.json"),
  ]);

  const best = [...lb].sort((a, b) => (b.silhouette || 0) - (a.silhouette || 0))[0];
  const clusters = Object.entries(labels).map(([k, v]) => ({
    id: Number(k),
    ...v,
  }));

  const cols: Column<LeaderboardP2>[] = [
    { key: "model", label: "모델" },
    { key: "n_clusters", label: "K", align: "right", format: "int" },
    { key: "silhouette", label: "Silhouette", align: "right", format: "float3" },
    { key: "calinski_harabasz", label: "Calinski-Harabasz", align: "right", format: "float2", digits: 1 },
    { key: "davies_bouldin", label: "Davies-Bouldin", align: "right", format: "float3" },
    { key: "n_noise", label: "Noise", align: "right", format: "int" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="PHASE 02"
        title="업종 클러스터링"
        description="9개 비지도 클러스터링 모델로 791사 그룹화. Silhouette·Calinski-Harabasz·Davies-Bouldin으로 평가."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label={"최고 모델"}
          value={best?.model ?? "—"}
          hint={
            best ? `Silhouette ${fmtFloat(best.silhouette, 3)}` : ""
          }
          accent="primary"
          icon={Crown}
        />
        <KpiCard label="클러스터 수" value={best?.n_clusters ?? 0} hint="최적 K" />
        <KpiCard label="총 기업" value={sc.length} hint="2023년" accent="info" />
        <KpiCard label="모델 수" value={lb.length} hint="sklearn 7 + DL 2" />
      </section>

      <section className="mb-6">
        <InsightCallout variant="info">
          KMeans·Agglomerative·AE+KMeans가 동일하게 Silhouette{" "}
          <b>{fmtFloat(best?.silhouette ?? 0, 3)}</b>로 1위 — 791사 중 1개 극단치
          기업이 단독 클러스터로 분리되어 매우 깨끗한 분할이 만들어졌습니다.
          반면 HDBSCAN은 8개 클러스터로 나누면서 387개 노이즈를 인정하는 더
          현실적인 그룹화를 제시합니다.
        </InsightCallout>
      </section>

      <section className="mb-6">
        <ChartShell
          title="PCA 2D 산점도"
          description="클러스터별 색상. 점 클릭 시 기업 상세로 이동."
        >
          <PcaScatter
            data={sc.map((s) => ({
              corp_code: s.corp_code,
              corp_name: s.corp_name,
              pca_1: s.pca_1,
              pca_2: s.pca_2,
              cluster: s.cluster,
              health_grade: s.health_grade,
            }))}
          />
        </ChartShell>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        {clusters.map((c) => (
          <Card key={c.id}>
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <Layers size={14} className="text-[var(--primary)]" />
              <h3 className="text-sm font-semibold">클러스터 {c.id} · {c.label}</h3>
              <Badge variant="outline" className="ml-auto">{c.size}사</Badge>
            </div>
            <div className="px-5 py-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-2">
                대표 기업 (centroid 근접)
              </div>
              <div className="space-y-1.5">
                {c.representatives.map((r) => (
                  <Link
                    key={r.corp_code}
                    href={`/company/${r.corp_code}`}
                    className="flex items-center justify-between text-xs py-1 hover:bg-[var(--surface-2)]/40 rounded px-2 -mx-2 transition-colors"
                  >
                    <span className="truncate">{r.corp_name}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular text-[var(--text-muted)]">
                        {r.health_score.toFixed(0)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="mb-6">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">
              9개 모델 리더보드 ·{" "}
              <DomainTooltip term="silhouette">평가 메트릭</DomainTooltip>
            </h3>
          </div>
          <div className="p-3">
            <LeaderboardTable data={lb} columns={cols} defaultSort="silhouette" />
          </div>
        </Card>
      </section>

      <NextSteps
        steps={[
          { href: "/phase-3", title: "Phase 3 이상탐지", description: "비지도 이상치 발견", icon: Layers },
          { href: "/cross-phase", title: "교차 분석", description: "클러스터와 위험의 관계", icon: Layers },
          { href: "/models", title: "모델 카탈로그", description: "9개 클러스터링 상세", icon: Layers },
        ]}
      />
    </>
  );
}
