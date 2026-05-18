import Link from "next/link";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NextSteps } from "@/components/next-steps";
import { WatchlistView } from "./watchlist-view";
import { loadJSON, type AnomalyFlag, type HealthScore } from "@/lib/data";

export const metadata = { title: "워치리스트 · DART Insights" };

export default async function WatchlistPage() {
  const [hs, flags] = await Promise.all([
    loadJSON<HealthScore[]>("health_scores.json"),
    loadJSON<AnomalyFlag[]>("anomaly_flags.json"),
  ]);

  // 빈 상태 추천: 위험 등급 또는 votes 높은 기업
  const suggestions = [...hs]
    .filter((h) => h.health_grade === "위험" || h.health_grade === "주의")
    .slice(0, 5)
    .map((h) => ({
      corp_code: h.corp_code,
      corp_name: h.corp_name,
      health_grade: h.health_grade,
      health_score: h.health_score,
    }));

  // 전체 인덱스 (kvjs): corp_code → 정보
  const index: Record<string, { corp_name: string; health_grade: string; health_score: number; anomaly_votes: number }> = {};
  for (const h of hs) {
    index[h.corp_code] = {
      corp_name: h.corp_name,
      health_grade: h.health_grade,
      health_score: h.health_score,
      anomaly_votes: 0,
    };
  }
  for (const a of flags) {
    if (index[a.corp_code]) index[a.corp_code].anomaly_votes = a.anomaly_votes;
  }

  return (
    <>
      <PageHeader
        eyebrow="WATCHLIST"
        title="워치리스트"
        description="⭐로 저장한 기업 모음. localStorage에 영구 저장되며 워치리스트 전체를 비교 모드에 일괄 추가하거나 CSV로 export할 수 있습니다."
      />

      <WatchlistView index={index} suggestions={suggestions} />

      <NextSteps
        steps={[
          { href: "/compare", title: "비교 모드", description: "워치리스트 전체 비교", icon: Star },
          { href: "/cross-phase", title: "교차 분석", description: "전체 흐름 살펴보기", icon: Star },
          { href: "/", title: "홈으로", description: "다른 기업 탐색", icon: Star },
        ]}
      />
    </>
  );
}
