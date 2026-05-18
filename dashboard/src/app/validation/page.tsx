import { Activity, AlertTriangle, FileText, Layers, LineChart, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { NextSteps } from "@/components/next-steps";

export const metadata = { title: "검증 방법론 · DART Insights" };

const METRICS = [
  {
    name: "AUC-ROC",
    formula: "∫ TPR d(FPR)",
    range: "0.5 (랜덤) ~ 1.0 (완벽)",
    use: "이진 분류기의 종합 성능",
  },
  {
    name: "F1 Score",
    formula: "2·P·R / (P + R)",
    range: "0 ~ 1",
    use: "Precision과 Recall의 조화평균 — 불균형 데이터",
  },
  {
    name: "Precision",
    formula: "TP / (TP + FP)",
    range: "0 ~ 1",
    use: "예측한 양성 중 실제 양성 비율 — 오탐 최소화",
  },
  {
    name: "Recall",
    formula: "TP / (TP + FN)",
    range: "0 ~ 1",
    use: "실제 양성 중 맞춘 비율 — 누락 최소화",
  },
  {
    name: "Silhouette",
    formula: "(b - a) / max(a, b)",
    range: "-1 ~ 1",
    use: "클러스터 분리도 (높을수록 좋음)",
  },
  {
    name: "Calinski-Harabasz",
    formula: "Var_between / Var_within",
    range: "0 ~ ∞",
    use: "클러스터 분산비 (높을수록 좋음, 비교 전용)",
  },
  {
    name: "Davies-Bouldin",
    formula: "avg max((σ_i + σ_j) / d_ij)",
    range: "0 ~ ∞",
    use: "클러스터 평균 유사도 (낮을수록 좋음)",
  },
  {
    name: "RMSE",
    formula: "√(Σ(y - ŷ)² / n)",
    range: "0 ~ ∞",
    use: "예측 오차 제곱평균제곱근",
  },
  {
    name: "MAE",
    formula: "Σ|y - ŷ| / n",
    range: "0 ~ ∞",
    use: "절대오차 평균 (outlier에 덜 민감)",
  },
  {
    name: "MAPE",
    formula: "Σ|y - ŷ| / |y| / n × 100",
    range: "0 ~ ∞ %",
    use: "비율 기반 오차 (실제값 0 부근에서 폭발)",
  },
];

const PHASE_VALIDATION = [
  {
    phase: "Phase 1 · 분류",
    icon: Activity,
    items: [
      { k: "Split", v: "70 / 15 / 15 (train / val / test)" },
      { k: "교차검증", v: "StratifiedKFold 5-fold" },
      { k: "라벨", v: "위험(부도/회생/거래정지) vs 안전 — 1.8% 불균형" },
      {
        k: "불균형 대응",
        v: "SMOTE / class_weight='balanced' / pos_weight (PyTorch) / scale_pos_weight=10 (XGBoost)",
      },
      { k: "메트릭", v: "AUC-ROC, F1, Precision, Recall, Accuracy" },
    ],
  },
  {
    phase: "Phase 2 · 클러스터링",
    icon: Layers,
    items: [
      { k: "방식", v: "비지도 (ground truth 없음)" },
      { k: "K 선택", v: "Silhouette Score 최대값 (k=2)" },
      { k: "메트릭", v: "Silhouette / Calinski-Harabasz / Davies-Bouldin" },
      { k: "노이즈", v: "DBSCAN/HDBSCAN에서 -1 라벨 제외 후 평가" },
    ],
  },
  {
    phase: "Phase 3 · 이상탐지",
    icon: AlertTriangle,
    items: [
      { k: "방식", v: "비지도 + pseudo-label 부재" },
      { k: "평가", v: "7개 모델 합의 (votes) 기반. precision/recall은 0 (ground truth 없음)" },
      { k: "contamination", v: "0.05 (모든 모델)" },
      { k: "앙상블", v: "threshold=3 (3개 이상 모델 동의 시 이상)" },
      { k: "추가 검증", v: "Benford's Law 카이제곱 검정 (p>0.05 준수)" },
    ],
  },
  {
    phase: "Phase 4 · 시계열",
    icon: LineChart,
    items: [
      { k: "Split", v: "처음 30개월 / 마지막 6개월 (forward chaining)" },
      { k: "모델", v: "ARIMA(2,1,1) / Prophet / LSTM / GRU / Transformer" },
      { k: "메트릭", v: "RMSE, MAE, MAPE" },
      { k: "데이터", v: "disclosure_monthly.csv (36개월)" },
    ],
  },
];

export default function ValidationPage() {
  return (
    <>
      <PageHeader
        eyebrow="VALIDATION"
        title="검증 방법론"
        description="4개 페이즈 각각의 train/test 전략, 메트릭 정의, 재현 명령어. 결과를 의심하기 전에 절차부터 검증하세요."
      />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        {PHASE_VALIDATION.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.phase}>
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
                <Icon size={14} className="text-[var(--primary)]" />
                <h3 className="text-sm font-semibold">{p.phase}</h3>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {p.items.map((it) => (
                  <div key={it.k} className="flex items-start gap-3 text-sm">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] w-20 flex-shrink-0 mt-1">
                      {it.k}
                    </div>
                    <div className="flex-1 text-[var(--text)] leading-relaxed">{it.v}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </section>

      <section className="mb-6">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <FileText size={14} />
            <h3 className="text-sm font-semibold">메트릭 정의</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)]/60 text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                <tr>
                  <th className="text-left px-4 py-2">메트릭</th>
                  <th className="text-left px-4 py-2">수식</th>
                  <th className="text-left px-4 py-2">범위</th>
                  <th className="text-left px-4 py-2">의미</th>
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => (
                  <tr key={m.name} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2 font-medium">{m.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{m.formula}</td>
                    <td className="px-4 py-2 text-xs text-[var(--text-muted)]">{m.range}</td>
                    <td className="px-4 py-2 text-xs text-[var(--text-muted)]">{m.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <Sparkles size={14} />
            <h3 className="text-sm font-semibold">재현 명령어</h3>
            <Badge variant="outline" className="ml-auto">macOS · OMP_NUM_THREADS=1</Badge>
          </div>
          <div className="p-5">
            <pre className="bg-[var(--background)]/60 rounded-md p-4 text-xs font-mono overflow-x-auto leading-relaxed">
{`source .venv/bin/activate

# 1) 사전 분석 5개 스크립트
OMP_NUM_THREADS=1 python3 src/phase1_explainability.py
OMP_NUM_THREADS=1 python3 src/phase2_cluster_labeling.py
OMP_NUM_THREADS=1 python3 src/phase3_benford.py
OMP_NUM_THREADS=1 python3 src/phase4_timeseries.py
OMP_NUM_THREADS=1 python3 src/cross_phase_analysis.py

# 2) JSON export
python3 dashboard/scripts/export_data.py

# 3) 대시보드 실행
cd dashboard
npm install
npm run dev   # http://localhost:3000`}
            </pre>
          </div>
        </Card>
      </section>

      <NextSteps
        steps={[
          { href: "/models", title: "모델 카탈로그", description: "37개 모델 상세", icon: FileText },
          { href: "/data", title: "데이터셋", description: "사용된 12개 데이터셋", icon: FileText },
          { href: "/glossary", title: "용어집", description: "재무·통계·ML 용어", icon: FileText },
        ]}
      />
    </>
  );
}
