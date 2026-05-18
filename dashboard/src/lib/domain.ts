export type DomainTerm = {
  ko: string;
  en?: string;
  short: string;
  detail: string;
  category: "재무" | "통계" | "ML" | "데이터";
};

export const TERMS: Record<string, DomainTerm> = {
  altman_z: {
    ko: "Altman Z-Score",
    en: "Altman Z-Score",
    short: "기업 파산 가능성을 가늠하는 다요인 지표",
    detail:
      "1.2·운전자본/자산 + 1.4·이익잉여금/자산 + 3.3·EBIT/자산 + 0.6·자본/부채 + 1.0·매출/자산. Z>2.99 안전, 1.81~2.99 회색, <1.81 위험구간.",
    category: "재무",
  },
  debt_ratio: {
    ko: "부채비율",
    en: "Debt Ratio",
    short: "총부채 / 총자본 (낮을수록 안정)",
    detail: "재무 레버리지의 가장 기본 지표. 100% 이하면 부채가 자본보다 적다는 뜻.",
    category: "재무",
  },
  current_ratio: {
    ko: "유동비율",
    en: "Current Ratio",
    short: "유동자산 / 유동부채 (단기 지급능력)",
    detail: "150% 이상이 통상적으로 양호, 100% 미만이면 단기 지급능력 우려.",
    category: "재무",
  },
  roe: {
    ko: "ROE",
    en: "Return on Equity",
    short: "당기순이익 / 자기자본 — 주주 자본 효율",
    detail: "10% 이상이 통상 양호. 부채로 ROE를 인위적으로 높일 수 있으니 부채비율과 함께 봐야 함.",
    category: "재무",
  },
  roa: {
    ko: "ROA",
    en: "Return on Assets",
    short: "당기순이익 / 총자산 — 자산 효율",
    detail: "자산을 얼마나 효과적으로 굴리는지. ROE와 ROA의 차이는 레버리지 효과.",
    category: "재무",
  },
  interest_coverage: {
    ko: "이자보상배율",
    en: "Interest Coverage",
    short: "영업이익 / 이자비용 (배율)",
    detail: "1 미만이면 영업으로 이자도 못 갚는 좀비기업. 3 이상이 안정권.",
    category: "재무",
  },
  operating_margin: {
    ko: "영업이익률",
    en: "Operating Margin",
    short: "영업이익 / 매출액 (수익성)",
    detail: "본업의 수익성을 나타냄. 업종별 표준이 매우 다름.",
    category: "재무",
  },
  health_score: {
    ko: "건전성 점수",
    en: "Health Score",
    short: "재무비율 가중합 (0~100)",
    detail:
      "부채비율 25% + 유동비율 20% + ROE 15% + ROA 15% + 이자보상배율 15% + 영업이익률 10%. 0~30 위험, 30~50 주의, 50~70 보통, 70~100 우량.",
    category: "재무",
  },
  silhouette: {
    ko: "Silhouette Score",
    short: "클러스터 분리도 (-1 ~ 1)",
    detail:
      "각 점이 자기 클러스터에 얼마나 잘 속하는지. 1에 가까울수록 잘 분리, 0 근처는 경계, 음수는 잘못된 할당.",
    category: "통계",
  },
  calinski_harabasz: {
    ko: "Calinski-Harabasz",
    short: "클러스터 분산비 (높을수록 좋음)",
    detail: "클러스터 간 분산 / 클러스터 내 분산. 절대 기준은 없고 비교용.",
    category: "통계",
  },
  davies_bouldin: {
    ko: "Davies-Bouldin",
    short: "클러스터 평균 유사도 (낮을수록 좋음)",
    detail: "각 클러스터의 가장 유사한 다른 클러스터와의 비율 평균. 0에 가까울수록 좋음.",
    category: "통계",
  },
  auc_roc: {
    ko: "AUC-ROC",
    short: "이진 분류기의 종합 성능 (0.5~1.0)",
    detail: "True Positive Rate vs False Positive Rate 곡선 아래 면적. 0.5는 랜덤, 1.0은 완벽.",
    category: "ML",
  },
  f1: {
    ko: "F1 Score",
    short: "Precision과 Recall의 조화평균",
    detail: "불균형 데이터에서 accuracy보다 더 정확. 2·P·R / (P+R).",
    category: "ML",
  },
  precision: {
    ko: "Precision",
    short: "예측한 양성 중 실제 양성 비율",
    detail: "TP / (TP + FP). 오탐을 줄이려면 precision이 중요.",
    category: "ML",
  },
  recall: {
    ko: "Recall",
    short: "실제 양성 중 맞춘 비율",
    detail: "TP / (TP + FN). 누락을 줄이려면 recall이 중요.",
    category: "ML",
  },
  rmse: {
    ko: "RMSE",
    short: "Root Mean Squared Error",
    detail: "예측 오차의 제곱평균제곱근. 큰 오차에 더 큰 페널티.",
    category: "ML",
  },
  mae: {
    ko: "MAE",
    short: "Mean Absolute Error",
    detail: "절대오차 평균. RMSE보다 outlier에 덜 민감.",
    category: "ML",
  },
  mape: {
    ko: "MAPE",
    short: "Mean Absolute Percentage Error",
    detail: "비율 기반 오차. 실제값이 0에 가까우면 폭발하므로 주의.",
    category: "ML",
  },
  shap: {
    ko: "SHAP value",
    short: "각 feature의 예측 기여도",
    detail: "Shapley value 기반. 양수면 양성 예측을 끌어올림, 음수면 깎아내림.",
    category: "ML",
  },
  benford: {
    ko: "Benford's Law",
    short: "자연수 첫자리는 1이 30% — 회계 분식 탐지에 활용",
    detail:
      "수많은 자연 데이터의 첫째 자릿수는 log10(1+1/d) 비율로 등장. 위반 시 인위 조작 의심.",
    category: "통계",
  },
  anomaly_votes: {
    ko: "이상치 합의 점수",
    short: "7개 모델 중 이상치로 판단한 모델 수 (0~7)",
    detail: "다수 모델이 동의할수록 신뢰도가 높음. ≥4면 강한 의심.",
    category: "ML",
  },
  cluster: {
    ko: "클러스터",
    short: "유사한 기업 그룹 (비지도 학습)",
    detail: "재무 특성이 유사한 기업들을 묶음. 라벨이 없는 상태에서 그룹화.",
    category: "ML",
  },
};
