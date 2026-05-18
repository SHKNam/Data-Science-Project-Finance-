import { loadJSON, type AnomalyFlag, type CrossPhaseSummary, type HealthScore, type LeaderboardP1, type LeaderboardP2, type LeaderboardP4, type Meta } from "@/lib/data";
import { PresentDeck } from "./present-deck";

export const metadata = { title: "발표 모드 · DART Insights" };

export default async function PresentPage() {
  const [meta, p1, p2, p4, hs, anomalies, cross] = await Promise.all([
    loadJSON<Meta>("meta.json"),
    loadJSON<LeaderboardP1[]>("phase1_leaderboard.json"),
    loadJSON<LeaderboardP2[]>("phase2_leaderboard.json"),
    loadJSON<LeaderboardP4[]>("phase4_leaderboard.json"),
    loadJSON<HealthScore[]>("health_scores.json"),
    loadJSON<AnomalyFlag[]>("anomaly_flags.json"),
    loadJSON<CrossPhaseSummary>("cross_phase_summary.json"),
  ]);

  const bestP1 = [...p1].sort((a, b) => (b.auc_roc || 0) - (a.auc_roc || 0))[0];
  const bestP2 = [...p2].sort((a, b) => (b.silhouette || 0) - (a.silhouette || 0))[0];
  const bestP4 = [...p4].sort((a, b) => (a.rmse || Infinity) - (b.rmse || Infinity))[0];
  const suspCount = anomalies.filter((a) => a.anomaly_votes >= 4).length;
  const grades = ["우량", "보통", "주의", "위험"].map((g) => ({
    g,
    n: hs.filter((h) => h.health_grade === g).length,
  }));

  return (
    <PresentDeck
      meta={meta}
      bestP1={bestP1}
      bestP2={bestP2}
      bestP4={bestP4}
      grades={grades}
      suspCount={suspCount}
      insights={cross.insights}
    />
  );
}
