export type GuideStep = {
  title: string;
  body: string;
  cta?: { href: string; label: string };
};

export type Guide = {
  slug: string;
  persona: string;
  title: string;
  description: string;
  estimated_time: string;
  accent: string;
  steps: GuideStep[];
};

export const GUIDES: Guide[] = [
  {
    slug: "find-risky-companies",
    persona: "Risk Officer",
    title: "위험 기업 발굴 워크플로우",
    description:
      "여러 모델이 합의한 의심 기업을 단계별로 좁히고 Benford 검증으로 마무리합니다.",
    estimated_time: "약 5분",
    accent: "from-red-500/20 to-red-500/5 border-red-500/30",
    steps: [
      {
        title: "1. 이상치 합의도가 높은 기업 확인",
        body:
          "Phase 3 페이지의 anomaly_votes 히스토그램에서 ≥4 구간을 봅니다. 다수 모델이 동의할수록 신뢰도가 높습니다.",
        cta: { href: "/phase-3", label: "Phase 3로 이동" },
      },
      {
        title: "2. 위험 라벨과 교차 분석",
        body:
          "Cross-phase 페이지에서 실제 부도/회생 라벨(risk=1)인 기업이 이상치 votes에서 어디 분포하는지, 클러스터별 패턴은 무엇인지 확인합니다.",
        cta: { href: "/cross-phase", label: "Cross-phase로" },
      },
      {
        title: "3. 의심 기업 개별 심층 분석",
        body:
          "기업 상세 페이지로 진입해 재무비율·Altman Z·동일 클러스터 위치를 확인합니다. 동종 평균 대비 어떤 지표가 비정상인지 보세요.",
      },
      {
        title: "4. Benford's Law로 회계 검증",
        body:
          "Phase 3의 Benford 섹션에서 첫째 자릿수 분포가 기대값과 얼마나 멀어졌는지 봅니다. KL divergence 상위 기업은 회계 조작 의심.",
        cta: { href: "/phase-3", label: "Benford 보기" },
      },
      {
        title: "5. 워치리스트 등록 + 비교",
        body:
          "주목할 기업은 ⭐로 저장하고 비교 모드에서 2~5개를 사이드바이사이드로 봅니다. CSV로 export 가능.",
        cta: { href: "/watchlist", label: "워치리스트" },
      },
    ],
  },
  {
    slug: "evaluate-a-company",
    persona: "Investor",
    title: "특정 기업 평가",
    description:
      "검색으로 시작해 재무·클러스터·공시 흐름을 종합 평가하는 투자자 워크플로우.",
    estimated_time: "약 4분",
    accent: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
    steps: [
      {
        title: "1. ⌘K로 기업 검색",
        body:
          "기업명 또는 corp_code(8자리)로 검색합니다. 예: '강남제비스코', '00100939'.",
      },
      {
        title: "2. 기업 상세 — 6대 재무비율 확인",
        body:
          "부채비율·유동비율·ROE·ROA·이자보상배율·영업이익률을 동종 클러스터 평균과 비교합니다.",
      },
      {
        title: "3. Altman Z-Score 게이지 해석",
        body:
          "Z>2.99 안전 / 1.81~2.99 회색 / <1.81 위험. 게이지 위치로 한눈에 판단.",
      },
      {
        title: "4. 동일 클러스터 유사 기업 5개",
        body:
          "PCA 거리 기준 자동 추천된 비슷한 기업 5개를 비교 모드에 추가해 사이드바이사이드 비교.",
        cta: { href: "/compare", label: "비교 모드" },
      },
      {
        title: "5. 공시 타임라인",
        body:
          "최근 공시 이력을 보고 이벤트 패턴을 파악합니다. 정정공시·외부감사 비율이 높으면 주의.",
      },
    ],
  },
  {
    slug: "compare-models",
    persona: "Data Scientist",
    title: "모델 성능 비교",
    description:
      "37개 모델의 메트릭·SHAP·재현 명령어. 어떤 모델을 운영에 올릴지 의사결정.",
    estimated_time: "약 6분",
    accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
    steps: [
      {
        title: "1. 모델 카탈로그 훑어보기",
        body:
          "페이즈별 탭으로 37개 모델 카드 확인. 학습 시간, 하이퍼파라미터, 구현 파일 위치까지.",
        cta: { href: "/models", label: "모델 카탈로그" },
      },
      {
        title: "2. Phase 1 리더보드 + 메트릭 그래프",
        body:
          "AUC-ROC, F1, Precision, Recall을 그룹 막대로 비교. 정렬·필터 가능. AdaBoost가 최고 F1.",
        cta: { href: "/phase-1", label: "Phase 1" },
      },
      {
        title: "3. 모델 상세 — 혼동행렬 + ROC/PR + SHAP",
        body:
          "최상위 모델 카드 클릭 → 혼동행렬, ROC/PR 곡선, feature importance, SHAP, PyTorch 학습 곡선까지.",
      },
      {
        title: "4. 비교 모드로 2~5개 모델 비교",
        body:
          "메트릭 막대 + 차이가 큰 항목 자동 하이라이트. 운영 모델 선정 회의에 그대로 활용.",
      },
      {
        title: "5. 재현 명령어 복사",
        body:
          "검증 페이지의 코드블록을 복사해 동일 환경에서 재현할 수 있습니다. OMP_NUM_THREADS=1 필수.",
        cta: { href: "/validation", label: "검증 방법론" },
      },
    ],
  },
  {
    slug: "methodology",
    persona: "Researcher",
    title: "방법론·재현·인용",
    description:
      "데이터 출처, 전처리 파이프라인, 검증 절차, 인용 정보까지.",
    estimated_time: "약 5분",
    accent: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
    steps: [
      {
        title: "1. 데이터 출처와 한계",
        body:
          "DART OpenAPI에서 수집한 791사 (KOSPI). 일일 한도 20,000. 2023 회계연도 기준.",
        cta: { href: "/data", label: "데이터셋" },
      },
      {
        title: "2. 전처리·Feature Engineering",
        body:
          "src/preprocessing.py + feature_engineering.py. Altman Z, 가중 합산 건전성 점수 산식.",
      },
      {
        title: "3. 페이즈별 검증 방법",
        body:
          "Phase 1: 70/15/15 + StratifiedKFold 5-fold. Phase 2: Silhouette/CH/DB. Phase 3: 앙상블 합의. Phase 4: forward chaining 30/6.",
        cta: { href: "/validation", label: "검증 방법론" },
      },
      {
        title: "4. 메트릭 정의와 한계",
        body:
          "Phase 1의 낮은 F1(0.063)은 위험 클래스 1.8% 불균형의 결과. 운영 가능성보다는 비교 분석 목적.",
      },
      {
        title: "5. 재현 명령어 + 인용",
        body:
          "5개 사전 분석 스크립트와 export 스크립트를 순서대로 실행하면 동일 산출물을 재현합니다.",
      },
    ],
  },
  {
    slug: "executive-tour",
    persona: "Executive",
    title: "1분 임원 투어",
    description:
      "발표·보고용으로 한 페이지에 핵심을 모은 경영진 전용 경로.",
    estimated_time: "약 1분",
    accent: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
    steps: [
      {
        title: "1. Executive Summary",
        body: "4페이즈 KPI + 자동 인사이트 3가지 + 위험 Top 5를 한 화면에서.",
        cta: { href: "/summary", label: "Summary" },
      },
      {
        title: "2. 발표 모드",
        body: "풀스크린 슬라이드 7장. ←/→ 키로 넘김. ESC로 종료.",
        cta: { href: "/present", label: "발표 모드" },
      },
      {
        title: "3. 인쇄/공유",
        body: "Cmd+P로 PDF 출력. 페이지 우상단 공유 URL 복사 버튼.",
      },
    ],
  },
  {
    slug: "understand-the-data",
    persona: "Common",
    title: "데이터 이해하기",
    description: "어떤 원본 데이터가 어떻게 가공되어 어떤 산출물이 됐는지.",
    estimated_time: "약 3분",
    accent: "from-zinc-500/20 to-zinc-500/5 border-zinc-500/30",
    steps: [
      {
        title: "1. 원본 데이터",
        body: "DART OpenAPI에서 corp_codes, financial_statements, risk_labels, disclosures 수집.",
      },
      {
        title: "2. 처리된 데이터 12종",
        body:
          "ratios → health_scores → sector_clusters → anomaly_flags → cross_phase_summary 흐름.",
        cta: { href: "/data", label: "데이터셋 카탈로그" },
      },
      {
        title: "3. 데이터 품질 주의사항",
        body:
          "corp_code는 항상 8자리 문자열(앞 0 보존). 일부 컬럼은 결측치를 평균/중앙값으로 보완.",
      },
      {
        title: "4. 용어집으로 보강",
        body: "재무·통계·ML 용어를 표준화된 정의로 확인.",
        cta: { href: "/glossary", label: "용어집" },
      },
    ],
  },
];
