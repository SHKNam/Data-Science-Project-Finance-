# Phase 진행 요약

---

## Phase 0: 환경 설정 (완료)
- **날짜**: 2026-05-17
- **내용**: Python 3.11 venv, 27개 패키지 설치, DART API 키 설정, Agent Teams 설정, git 초기화
- **GitHub**: https://github.com/SHKNam/Data-Science-Project-Finance-
- **주요 오류**: XGBoost libomp 누락 → `brew install libomp`

---

## Phase 1: Financial Health Scoring (완료)
- **날짜**: 2026-05-17

### 데이터 수집
| 항목 | 결과 |
|------|------|
| 대상 | KOSPI 상장사 838개 (2023년) |
| 재무제표 | 159,842건 |
| API 호출 | 7,454건 |
| 위험 기업 | 14건 (부도 1, 영업정지 13, 회생 2, 중복 포함) |

### 전처리
- 핵심 계정 10종 추출 → 814개 기업
- 결측률 50% 초과 23개 제거 → **791개 기업**
- Winsorization (IQR×3) 적용

### Feature Engineering
- 재무 비율 6종: 부채비율, 유동비율, ROE, ROA, 이자보상배율, 영업이익률
- Altman Z-Score + 건전성 등급 (우량/보통/주의/위험)
- 건전성 등급 분포: 우량 128 / 보통 245 / 주의 318 / 위험 100

### 모델 리더보드 (15개 모델)
| Rank | Model | F1 | AUC-ROC | Precision | Recall |
|------|-------|----|---------|-----------|--------|
| 1 | AdaBoost | 0.0625 | 0.578 | 0.036 | 0.25 |
| 2 | VotingEnsemble | 0.0625 | 0.592 | 0.033 | 0.50 |
| 3 | CNN1D | 0.0580 | 0.467 | 0.031 | 0.50 |
| 4 | SVC_rbf | 0.0571 | 0.606 | 0.030 | 0.50 |
| 5 | LogisticRegression | 0.0494 | 0.442 | 0.026 | 0.50 |

### 한계점 및 인사이트
- **극심한 불균형**: 위험 14건 / 정상 777건 (1.8%) → SMOTE 적용했으나 테스트셋 위험 기업 4건으로 평가 불안정
- **F1 점수 저조**: 최고 0.0625 — 불균형 + 적은 양성 샘플이 근본 원인
- **AUC-ROC 기준**: XGBoost(0.688), GradientBoosting(0.687)이 양성 식별 능력은 우수
- **Altman Z-Score**: Distress 237 / Grey 130 / Safe 424 — 규칙 기반 스코어링은 유의미
- **개선 방안**: KOSDAQ 추가 → 양성 샘플 증가 / 다년도(2021~2025) 수집 / 더 많은 feature 추가

### 저장된 파일
- `data/processed/financial_statements.csv` — 전처리 완료 데이터
- `data/processed/financial_ratios.csv` — Feature Engineering 완료
- `data/processed/health_scores.csv` — 건전성 점수 (Phase 4 연계용)
- `models/phase1_leaderboard.csv` — 리더보드
- `models/best_AdaBoost.joblib` — 최적 모델

### 오류 기록
1. DS005 API 파라미터 (`bsns_year` → `bgn_de/end_de`)
2. corp_code leading zeros 손실 (CSV dtype=str 필수)
3. XGBoost/LightGBM macOS segfault (`OMP_NUM_THREADS=1`, `n_jobs=1`)
4. AdaBoostClassifier `algorithm` 파라미터 제거됨 (sklearn 최신)

---

## Phase 2: Sector Comparison (완료)
- **날짜**: 2026-05-17

### 데이터
- Phase 1 재무지표 재활용 (791개 기업)
- 업종코드: KOSPI 필터링 시 이미 수집 (304개 업종)

### 클러스터링 리더보드 (8개 모델)
| Rank | Model | Silhouette | Calinski-Harabasz | Davies-Bouldin |
|------|-------|-----------|-------------------|----------------|
| 1 | KMeans | 0.9514 | 478.1 | 0.033 |
| 2 | Agglomerative | 0.9514 | 478.1 | 0.033 |
| 3 | AE+KMeans | 0.9514 | 478.1 | 0.033 |
| 4 | HDBSCAN | 0.6451 | 683.1 | 0.411 |
| 5 | GaussianMixture | 0.5081 | 49.1 | 2.458 |
| 6 | MiniBatchKMeans | 0.4546 | 145.9 | 1.179 |
| 7 | Spectral | 0.3870 | 147.4 | 1.236 |
| 8 | DBSCAN | N/A (1 cluster) | N/A | N/A |

### 인사이트
- **최적 k=2**: Silhouette 0.95로 매우 높으나, 클러스터1에 기업 1개만 배정 (극단적 이상치 분리)
- **HDBSCAN**: 8개 클러스터 자동 탐지, 387개 noise — 밀도 기반으로 더 세밀한 구분
- **상위 기업**: 세우글로벌(88.5점), 오리엔트바이오(87.8점), 유엔젤(87.0점)
- **하위 기업**: 지역난방공사(16.9점), 하이트진로홀딩스(18.9점), 롯데렌탈(20.3점)
- **PCA 설명 분산**: 44.6% + 21.3% = 65.9%

### 저장된 파일
- `data/processed/sector_clusters.csv` — 클러스터 + PCA 결과
- `data/processed/sector_ranking.csv` — 건전성 기준 기업 순위
- `models/phase2_leaderboard.csv` — 클러스터링 리더보드

---

## Phase 3: Anomaly Detection (완료)
- **날짜**: 2026-05-17

### 이상탐지 리더보드 (6개 모델)
| Model | 이상 기업 수 | 이상 비율 |
|-------|------------|----------|
| IsolationForest | 40 | 5.1% |
| LOF | 40 | 5.1% |
| EllipticEnvelope | 40 | 5.1% |
| DeepAutoencoder | 40 | 5.1% |
| OneClassSVM | 39 | 4.9% |
| DBSCAN | 23 | 2.9% |

### 앙상블 결과
- **36건** 이상 기업 (3개 이상 모델 동의)
- 이상 기업 = 주로 **대형주** (삼성전자, 현대자동차, SK 등) — 규모 이상치
- 위험 기업(DS005)과 겹치는 기업: **0건** — 재무 규모 이상치 ≠ 신용 위험

### Benford's Law
| 항목 | chi2 | p-value | 법칙 준수 |
|------|------|---------|----------|
| total_assets | 10.92 | 0.2063 | Yes |
| revenue | 3056.20 | 0.0000 | No |
| net_income | 6564.14 | 0.0000 | No |

### 인사이트
- 매출액/순이익은 Benford 법칙 불일치 — 한국 재무 데이터 특성 (수치 집중)
- 자산총계는 Benford 법칙 준수 — 자연스러운 분포
- 이상탐지 모델은 **규모 이상치** (대기업)를 주로 탐지 — 다년도 시계열 변동 기반 탐지가 더 유의미할 것

### 저장된 파일
- `data/processed/anomaly_flags.csv` — 이상 탐지 결과
- `models/phase3_leaderboard.csv` — 리더보드

---

## Phase 4: Disclosure Event Analysis (완료)
- **날짜**: 2026-05-17

### 데이터 수집
| 항목 | 결과 |
|------|------|
| 전체 공시 | **120,000건** (2023~2025, 분기별 수집) |
| 기간 | 2023-01-06 ~ 2025-12-31 |
| 월별 시계열 | 36 포인트 |

### 공시 유형 분포
| 유형 | 건수 | 비율 |
|------|------|------|
| 기타 | 56,509 | 47.1% |
| 정정공시 | 14,670 | 12.2% |
| 발행공시 | 14,544 | 12.1% |
| 외부감사 | 14,086 | 11.7% |
| 지분공시 | 11,620 | 9.7% |
| 주요사항 | 4,571 | 3.8% |
| 정기보고서 | 3,563 | 3.0% |
| 구조변경 | 437 | 0.4% |

### 시계열 분석
- **ARIMA**: 최적 모델 (2,0,0)(1,1,0,12) — 계절적 패턴 포착
- **시계열 분해**: 추세 범위 3,316~3,333 (안정적)
- 월별 데이터 36개 포인트로 LSTM/GRU/Transformer는 데이터 부족으로 미적용

### Cross-Phase 인사이트 (Phase 1 연계)
- **건전성 점수 ↔ 공시 빈도**: Spearman r=-0.4085 (p<0.001)
- **해석**: 건전성이 낮은 기업일수록 공시가 많음 (부정적 이벤트 공시 증가)
- 통계적으로 매우 유의미한 음의 상관관계

### 오류 기록
- DART list API: corp_code 없이 전체 검색 시 **3개월 제한** → 분기별 호출로 해결

### 저장된 파일
- `data/processed/disclosure_events.csv` — 공시 데이터 (유형 분류 포함)
- `data/processed/disclosure_monthly.csv` — 월별 집계
- `models/phase4_summary.csv` — 분석 요약

---

## 전체 프로젝트 요약

### 4개 Phase 핵심 결과
| Phase | 핵심 성과 |
|-------|----------|
| 1. Financial Health | Altman Z-Score 기반 건전성 등급 분류 (우량 128/보통 245/주의 318/위험 100) |
| 2. Sector Comparison | KMeans 클러스터링 Silhouette 0.95 / 상위: 세우글로벌, 하위: 지역난방공사 |
| 3. Anomaly Detection | 36건 이상 기업 탐지 (앙상블) — 주로 대형주 규모 이상치 |
| 4. Disclosure Event | 건전성↔공시빈도 r=-0.41 (건전성 낮을수록 공시 많음) |

### 한계점 및 향후 과제
1. **불균형 문제**: 위험 기업 14건(1.8%)으로 ML 분류 성능 제한적 → KOSDAQ 확장/다년도 수집
2. **단일 연도**: 2023년만 분석 — 시계열 이상탐지에 다년도(2021~2025) 필요
3. **규모 이상치**: Phase 3에서 대기업이 이상치로 탐지됨 → 규모 정규화 또는 업종별 분리 분석
4. **시계열 데이터**: 36개 포인트로 딥러닝 시계열 모델(LSTM/GRU) 적용 불가 → 주별 집계로 확장 가능
