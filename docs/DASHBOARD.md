# DART Insights Dashboard

페르소나·시나리오 기반 User Journey 중심으로 설계된 다크 테마 Next.js 16 대시보드.

## 빠른 시작

```bash
# 1) 사전 분석 5개 스크립트 실행 (이미 실행됐다면 건너뜀)
source .venv/bin/activate
OMP_NUM_THREADS=1 python3 src/phase1_explainability.py
OMP_NUM_THREADS=1 python3 src/phase2_cluster_labeling.py
OMP_NUM_THREADS=1 python3 src/phase3_benford.py
OMP_NUM_THREADS=1 python3 src/phase4_timeseries.py
OMP_NUM_THREADS=1 python3 src/cross_phase_analysis.py

# 2) JSON export
python3 dashboard/scripts/export_data.py
# → dashboard/public/data/*.json (31개 파일)

# 3) 대시보드 실행
cd dashboard
npm install
npm run dev      # http://localhost:3000
```

## 페르소나 & User Journey

5가지 페르소나가 각자 다른 경로로 가치를 얻습니다. 랜딩 페이지의 "역할별 빠른 시작" 카드에서 진입.

| 페르소나 | 시작점 | 가이드 |
|---|---|---|
| 📊 Risk Officer | 위험 기업 발굴 | `/guides/find-risky-companies` |
| 💼 Investor | 특정 기업 평가 | `/guides/evaluate-a-company` |
| 🔬 Data Scientist | 모델 성능 비교 | `/guides/compare-models` |
| 🎓 Researcher | 방법론·재현 | `/guides/methodology` |
| 👔 Executive | 1분 요약 | `/guides/executive-tour` |

## 라우트 맵 (20개)

```
/                          홈 (페르소나 카드 + 핵심 KPI)
/summary                   Executive Summary 1페이지
/phase-1                   재무건전성 분류 (16 모델)
/phase-2                   업종 클러스터링 (9 모델)
/phase-3                   이상탐지 + Benford's Law
/phase-4                   공시 시계열 (5 모델)
/cross-phase               Sankey + 4분면 + stacked
/company/[corp_code]       기업 상세 (200개 SSG)
/compare                   비교 모드 (2~5개)
/watchlist                 localStorage 워치리스트
/models                    모델 카탈로그 (37개)
/data                      데이터셋 카탈로그
/validation                검증 방법론 + 재현 명령어
/glossary                  재무·통계·ML 용어집
/guides                    시나리오 가이드 인덱스
/guides/[slug]             6개 가이드
/present                   풀스크린 발표 모드 (←/→)
/help                      단축키 + FAQ
not-found.tsx              404
error.tsx                  500
```

## 키보드 단축키

| 키 | 동작 |
|---|---|
| ⌘/Ctrl + K | 명령 팔레트 |
| `/` | 검색 |
| `g 1~4` | Phase 1~4 |
| `g s` | Summary |
| `g c` | Compare |
| `g w` | Watchlist |
| `g m/d/v/h` | Models/Data/Validation/Home |
| `?` | 단축키 모달 |
| ESC | 닫기 |

## 핵심 컴포넌트

- **`<PersonaCards>`** — 랜딩 페이지 5개 역할 카드
- **`<KpiCard>`** — 다양한 accent 색상
- **`<InsightCallout>`** — 자동 생성 핵심 발견
- **`<NextSteps>`** — 모든 페이지 하단 3개 카드 (막다른 길 0)
- **`<CompareTray>`** — 하단 floating 비교 트레이
- **`<WatchlistButton>`** — ⭐ 즐겨찾기 토글 (zustand persist)
- **`<DomainTooltip>`** — 재무·통계 용어 hover 설명
- **`<AttentionBadge>`** — 극단치 시각 강조
- **`<SimilarCompanies>`** — PCA 거리 기반 5개 추천
- **`<OnboardingTour>`** — driver.js 첫 방문 4-step 투어
- **`<CommandPalette>`** — cmdk + fuse.js 퍼지 검색

## 차트 라이브러리 (Recharts)

- `roc-pr-chart` — 모델 다중선택 가능
- `confusion-matrix` — heatmap-style
- `learning-curve` — PyTorch 에폭 loss
- `pca-scatter` — 클릭 시 기업 상세로 이동
- `radar-comparison` — 클러스터 평균 대비
- `votes-histogram` — 이상치 합의도
- `benford-bar` — Composed bar+line
- `forecast-chart` — 시계열 + 5개 모델 오버레이
- `decomposition-chart` — trend/seasonal/residual
- `sankey-chart` — 등급→클러스터→이상치 흐름
- `quadrant-scatter` — 위험×votes 4분면

## 디자인 시스템

- **다크 테마 강제** (oklch 토큰)
- 배경: 푸른 기운의 검정 + radial gradient 오버레이
- 차트 팔레트: emerald → blue → purple → amber → pink
- Inter (본문) + JetBrains Mono (숫자)
- 등폭 숫자 (`font-feature-settings: 'tnum'`)

## 데이터 흐름

```
data/raw/*.csv (DART OpenAPI)
    ↓ src/preprocessing.py
data/processed/*.csv (financial_ratios, sector_clusters, anomaly_flags, ...)
    ↓ src/phase1~4_*.py (사전 분석 5개)
data/processed/phase*_*.json + .csv (ROC, SHAP, Benford, forecasts, ...)
    ↓ dashboard/scripts/export_data.py
dashboard/public/data/*.json (31개)
    ↓ Next.js Server Components (loadJSON)
브라우저
```

## 성능

- 정적 페이지 16개 + SSG 200개 (기업 상세) + Dynamic 1개 (`/compare`)
- 전체 빌드 시간 ~10초 (Turbopack)
- localStorage 영구 저장 (워치리스트·최근·비교)
- URL 동기화된 필터/상태 (nuqs)

## 알려진 제약

- `disclosure_events.csv` 120,000건은 요약 통계로만 export (raw는 너무 큼)
- Phase 1 모든 모델의 SHAP 계산은 시간이 오래 걸리므로 AdaBoost(최상위)만 SHAP 보유
- Prophet 시계열 예측은 데이터 부족으로 정확도 매우 낮음 (참고만)
- 워치리스트는 브라우저 localStorage 기반 — 기기 간 동기화 안 됨
