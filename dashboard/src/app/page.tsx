import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Layers,
  LineChart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightCallout } from "@/components/insight-callout";
import { PersonaCards } from "@/components/persona-cards";
import { NextSteps } from "@/components/next-steps";
import {
  loadJSON,
  type LeaderboardP1,
  type LeaderboardP2,
  type LeaderboardP4,
  type AnomalyFlag,
  type Meta,
  type CrossPhaseSummary,
} from "@/lib/data";
import { fmtNumber, fmtFloat } from "@/lib/format";

export default async function Home() {
  const [p1, p2, p4, anomalies, meta, cross] = await Promise.all([
    loadJSON<LeaderboardP1[]>("phase1_leaderboard.json"),
    loadJSON<LeaderboardP2[]>("phase2_leaderboard.json"),
    loadJSON<LeaderboardP4[]>("phase4_leaderboard.json"),
    loadJSON<AnomalyFlag[]>("anomaly_flags.json"),
    loadJSON<Meta>("meta.json"),
    loadJSON<CrossPhaseSummary>("cross_phase_summary.json"),
  ]);

  const bestP1 = [...p1].sort((a, b) => (b.auc_roc || 0) - (a.auc_roc || 0))[0];
  const bestP2 = [...p2].sort((a, b) => (b.silhouette || 0) - (a.silhouette || 0))[0];
  const bestP4 = [...p4].sort((a, b) => (a.rmse || Infinity) - (b.rmse || Infinity))[0];
  const suspCount = anomalies.filter((a) => (a.anomaly_votes || 0) >= 4).length;

  return (
    <>
      <section className="mb-12 animate-fade-up">
        <Badge variant="primary" className="mb-4">
          <Sparkles size={11} /> DART OpenAPI · 4 페이즈 분석 완료
        </Badge>
        <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
          한국 상장기업 <span className="text-[var(--primary)]">{meta.n_companies}사</span>의<br />
          재무·이상·시계열을 한 시야로
        </h1>
        <p className="mt-4 text-base text-[var(--text-muted)] max-w-2xl">
          37개 모델 · 120,000건 공시 · 16개 재무지표를 통합한 데이터 사이언스
          대시보드. 5가지 역할에 맞춘 워크플로우로 가장 빠른 인사이트를 제공합니다.
        </p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="분석 기업"
            value={fmtNumber(meta.n_companies)}
            hint="2023년 사업연도 기준"
            accent="info"
            icon={Building2}
          />
          <KpiCard
            label="최고 분류 모델"
            value={bestP1?.model ?? "—"}
            hint={bestP1 ? `AUC ${fmtFloat(bestP1.auc_roc, 3)}` : ""}
            accent="primary"
            icon={Activity}
          />
          <KpiCard
            label="최적 클러스터"
            value={bestP2?.model ?? "—"}
            hint={bestP2 ? `Silhouette ${fmtFloat(bestP2.silhouette, 3)}` : ""}
            accent="primary"
            icon={Layers}
          />
          <KpiCard
            label="이상 의심 (votes≥4)"
            value={fmtNumber(suspCount)}
            hint="다수 모델 합의"
            accent={suspCount > 0 ? "warning" : "default"}
            icon={AlertTriangle}
          />
        </div>
      </section>

      <section className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {cross.insights.slice(0, 3).map((insight, i) => (
          <InsightCallout
            key={i}
            title={`핵심 발견 ${i + 1}`}
            variant={i === 0 ? "warning" : i === 1 ? "default" : "info"}
          >
            {insight}
          </InsightCallout>
        ))}
      </section>

      <PersonaCards />

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--primary)] font-semibold mb-4">
          페이즈 살펴보기
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <PhaseLink
            href="/phase-1"
            icon={Activity}
            no="01"
            title="재무건전성"
            subtitle="16 분류 모델"
            metric={bestP1 ? `최고 AUC ${fmtFloat(bestP1.auc_roc, 3)}` : ""}
          />
          <PhaseLink
            href="/phase-2"
            icon={Layers}
            no="02"
            title="업종 클러스터"
            subtitle="9 클러스터링"
            metric={bestP2 ? `Silhouette ${fmtFloat(bestP2.silhouette, 3)}` : ""}
          />
          <PhaseLink
            href="/phase-3"
            icon={AlertTriangle}
            no="03"
            title="이상탐지 + Benford"
            subtitle="7 모델 앙상블"
            metric={`${anomalies.filter((a) => a.anomaly_votes >= 3).length}건 의심`}
          />
          <PhaseLink
            href="/phase-4"
            icon={LineChart}
            no="04"
            title="공시 시계열"
            subtitle="5 시계열 모델"
            metric={bestP4 ? `최저 RMSE ${fmtFloat(bestP4.rmse, 0)} (${bestP4.model})` : ""}
          />
        </div>
      </section>

      <NextSteps
        steps={[
          {
            href: "/summary",
            title: "Executive Summary",
            description: "한 페이지에 모든 핵심 KPI와 발견 3가지",
            icon: Sparkles,
          },
          {
            href: "/cross-phase",
            title: "Cross-phase 교차 분석",
            description: "위험·이상치·클러스터·등급의 흐름 관계 (Sankey)",
            icon: TrendingUp,
          },
          {
            href: "/guides",
            title: "시나리오 가이드",
            description: "역할별 단계별 워크플로우 6종",
            icon: ArrowRight,
          },
        ]}
      />
    </>
  );
}

function PhaseLink({
  href,
  icon: Icon,
  no,
  title,
  subtitle,
  metric,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  no: string;
  title: string;
  subtitle: string;
  metric: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all hover:border-[var(--border-strong)] hover:translate-y-[-2px]">
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-[var(--text-dim)]">{no}</span>
            <div className="w-7 h-7 rounded-md bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
              <Icon size={14} />
            </div>
          </div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</div>
          <div className="mt-3 text-[11px] text-[var(--primary)] tabular">{metric}</div>
        </div>
      </Card>
    </Link>
  );
}
