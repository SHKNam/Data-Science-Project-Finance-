# 프로젝트: DART 금융 데이터 분석

## 기술 스택
- Python 3.x
- pandas, numpy (데이터 처리)
- matplotlib, seaborn (시각화)
- jupyter notebook (분석)
- DART OpenAPI (데이터 소스)

## 아키텍처 규칙
- CRITICAL: API 키는 .env 파일에 저장하고 절대 코드에 하드코딩하지 말 것
- CRITICAL: 원본 데이터(data/raw/)는 수정하지 말 것. 전처리 결과는 data/processed/에 저장
- 분석 코드는 src/에, 탐색적 분석은 notebooks/에 작성
- 대시보드는 `dashboard/`에 격리. 데이터는 read-only로 `public/data/`로만 export (Python → JSON)

## 개발 프로세스
- 커밋 메시지는 conventional commits 형식을 따를 것 (feat:, fix:, docs:, refactor:)
- 데이터 파일(.csv, .xlsx, .json)은 git에 포함하지 않을 것

## 에이전트 팀 규칙
- CRITICAL: broadcast(전체 공지) 금지
- CRITICAL: 작업 완료 후 즉시 종료 (세션 유지 = 토큰 낭비)
- CRITICAL: 반복 시도 최대 3회 제한
- 모든 팀원은 변경 전 반드시 plan approval을 받을 것
- 팀원 모델: Sonnet (비용 최적화)

## 오류 기록 (발생 시 추가)
<!-- 오류 발생 시 아래 형식으로 기록하여 재발 방지 -->
<!-- ### [날짜] 오류 제목 -->
<!-- - 증상: -->
<!-- - 원인: -->
<!-- - 해결: -->

### [2026-05-17] XGBoost libxgboost.dylib 로드 실패
- 증상: `XGBoost Library (libxgboost.dylib) could not be loaded` — libomp.dylib 없음
- 원인: macOS에서 OpenMP 런타임이 미설치
- 해결: `brew install libomp`

### [2026-05-17] DART list API 3개월 제한
- 증상: `corp_code가 없는 경우 검색기간은 3개월만 가능합니다`
- 원인: 공시검색 API에서 corp_code 없이 전체 검색 시 최대 3개월 기간 제한
- 해결: 1년을 분기별(3개월)로 나눠서 호출. 또는 특정 corp_code 지정.

### [2026-05-17] LightGBM/XGBoost macOS segfault (exit code 139)
- 증상: LightGBM 학습 시 segfault 발생 (exit code 139)
- 원인: macOS에서 OpenMP 멀티스레딩 충돌
- 해결: `OMP_NUM_THREADS=1` 환경변수 + XGBoost(`nthread=1, tree_method="hist"`) + LightGBM(`n_jobs=1`)

### [2026-05-17] AdaBoostClassifier algorithm 파라미터 제거됨
- 증상: `TypeError: AdaBoostClassifier.__init__() got an unexpected keyword argument 'algorithm'`
- 원인: scikit-learn 최신 버전에서 `algorithm` 파라미터가 제거됨
- 해결: `algorithm="SAMME"` 인자 삭제

### [2026-05-17] corp_code leading zeros 손실
- 증상: ratios와 labels 병합 시 교집합 0 — 위험 라벨이 전부 0으로 나옴
- 원인: CSV 저장/로드 시 corp_code(`00126380`)의 앞 `00`이 숫자로 해석되어 `126380`으로 변환
- 해결: CSV 로드 시 `dtype=str` 또는 `.str.zfill(8)`로 8자리 패딩. CRITICAL: corp_code는 항상 문자열(str)로 처리할 것.

### [2026-05-17] DS005 API 파라미터 오류 (dfOcr, bsnSp, ctrcvsBgrq)
- 증상: `status=100, 필수값(corp_code,bgn_de,end_de)이 누락되었습니다`
- 원인: DS005 주요사항보고서 API는 `bsns_year/reprt_code` 대신 `bgn_de/end_de` (날짜 범위) 파라미터를 사용
- 해결: `bgn_de=YYYY0101`, `end_de=YYYY1231` 형식으로 변경. DS003(재무정보)과 DS005(주요사항) API 파라미터가 다름을 주의.

### [2026-05-17] logging FileNotFoundError — 상대 경로 문제
- 증상: `FileNotFoundError: No such file or directory: '.../src/logs/data_collection.log'`
- 원인: `logging.FileHandler("logs/...")` 상대 경로가 CWD(src/) 기준으로 해석됨
- 해결: `config.py`의 `LOGS_DIR` (PROJECT_ROOT 기준 절대 경로) 사용. 모든 파일 경로는 `config.py` 상수 사용할 것.

## 명령어
source .venv/bin/activate         # 가상환경 활성화
python3 src/data_collection.py    # 데이터 수집
jupyter notebook                   # 노트북 실행
python3 -m pytest tests/ -v       # 테스트 실행

# 사전 분석 (대시보드 산출물 생성) — 모두 OMP_NUM_THREADS=1 필수 (macOS)
OMP_NUM_THREADS=1 python3 src/phase1_explainability.py    # ROC/PR/혼동행렬/SHAP/학습곡선
OMP_NUM_THREADS=1 python3 src/phase2_cluster_labeling.py  # 클러스터 centroid + 자동 라벨
OMP_NUM_THREADS=1 python3 src/phase3_benford.py           # Benford's Law 자릿수 분포
OMP_NUM_THREADS=1 python3 src/phase4_timeseries.py        # ARIMA/Prophet/LSTM/GRU/Transformer
OMP_NUM_THREADS=1 python3 src/cross_phase_analysis.py     # 위험×이상치×클러스터 교차

# 대시보드 (Next.js 16 + React 19 + Tailwind v4 + Recharts)
python3 dashboard/scripts/export_data.py                   # CSV → JSON (31개 파일)
cd dashboard && npm install                                # 의존성
cd dashboard && npm run dev                                # http://localhost:3000
cd dashboard && npm run build                              # 프로덕션 (Static + SSG + Dynamic)

## 대시보드 라우트 (20개)
- `/`, `/summary` — 랜딩 + Executive Summary (페르소나 5종)
- `/phase-1~4` — 16/9/7/5 모델 비교 + 시각화
- `/cross-phase` — Sankey + 4분면 + stacked
- `/company/[corp_code]` — 200개 사전 생성 (SSG)
- `/compare`, `/watchlist` — localStorage 지속
- `/guides/[slug]` — 6개 시나리오 (find-risky-companies, evaluate-a-company 등)
- `/models`, `/data`, `/validation`, `/glossary`
- `/present` — 발표 모드 (←/→), `/help` — 단축키 + FAQ
- `not-found.tsx`, `error.tsx`

## 키보드 단축키
- ⌘/Ctrl + K, / — 검색 / 명령 팔레트
- g + 1~4 — Phase 페이지, g+s/c/w/m/d/v/h — 주요 페이지
- ? — 단축키 도움말 모달, ESC — 닫기
