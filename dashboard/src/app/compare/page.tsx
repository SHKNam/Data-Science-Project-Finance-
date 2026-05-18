import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NextSteps } from "@/components/next-steps";
import {
  loadJSON,
  type LeaderboardP1,
  type LeaderboardP2,
  type LeaderboardP3,
  type LeaderboardP4,
  type SectorCluster,
} from "@/lib/data";
import { fmtFloat, gradeBg } from "@/lib/format";
import { CompareView } from "./compare-view";

export const metadata = { title: "비교 모드 · DART Insights" };

export default async function ComparePage(
  props: { searchParams: Promise<{ type?: string; ids?: string }> },
) {
  const sp = await props.searchParams;
  const type = sp.type === "model" ? "model" : "company";
  const ids = (sp.ids ?? "").split(",").filter(Boolean);

  if (ids.length < 2) {
    return (
      <>
        <PageHeader
          eyebrow="COMPARE"
          title="비교 모드"
          description="기업 또는 모델 2~5개를 사이드바이사이드로 비교합니다. 비교 트레이(화면 하단)에서 항목을 추가하세요."
        />
        <EmptyState
          title="비교할 항목이 없습니다"
          description="기업 페이지나 모델 카탈로그에서 '비교 추가' 버튼을 누르면 화면 하단 트레이에 누적됩니다. 2개 이상이 되면 비교하기 버튼이 활성화됩니다."
          action={
            <div className="flex justify-center gap-2 mt-2">
              <Link href="/phase-2" className="text-xs text-[var(--primary)] underline">업종 클러스터로 가기</Link>
              <Link href="/models" className="text-xs text-[var(--primary)] underline">모델 카탈로그로 가기</Link>
            </div>
          }
        />
      </>
    );
  }

  let items: Array<Record<string, unknown>> = [];
  if (type === "company") {
    const sc = await loadJSON<SectorCluster[]>("sector_clusters.json");
    items = sc.filter((s) => ids.includes(s.corp_code));
  } else {
    const [p1, p2, p3, p4] = await Promise.all([
      loadJSON<LeaderboardP1[]>("phase1_leaderboard.json"),
      loadJSON<LeaderboardP2[]>("phase2_leaderboard.json"),
      loadJSON<LeaderboardP3[]>("phase3_leaderboard.json"),
      loadJSON<LeaderboardP4[]>("phase4_leaderboard.json"),
    ]);
    const all = [...p1, ...p2, ...p3, ...p4] as Array<Record<string, unknown>>;
    items = all.filter((m) => ids.includes(String(m.model)));
  }

  return (
    <>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] mb-3 transition-colors"
      >
        <ArrowLeft size={12} /> 홈으로
      </Link>

      <PageHeader
        eyebrow="COMPARE"
        title={type === "company" ? "기업 비교" : "모델 비교"}
        description={`${ids.length}개 ${type === "company" ? "기업" : "모델"} 사이드바이사이드 비교 — 차이가 큰 항목은 자동 하이라이트.`}
      />

      <CompareView items={items} type={type} />

      <NextSteps
        steps={[
          { href: "/", title: "홈으로", description: "다른 분석 시작", icon: ArrowLeft },
          { href: "/watchlist", title: "워치리스트", description: "관심 항목 저장", icon: ArrowLeft },
          { href: "/cross-phase", title: "교차 분석", description: "전체적 흐름 확인", icon: ArrowLeft },
        ]}
      />
    </>
  );
}
