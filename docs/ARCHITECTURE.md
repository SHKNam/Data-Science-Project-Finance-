# 아키텍처

## 디렉토리 구조
```
.
├── data/
│   ├── raw/               # DART API 원본 (캐시, CSV/XML)
│   └── processed/         # 전처리 완료 + Phase 간 공유 데이터
├── models/                # 학습된 모델 저장 (.joblib, .pt)
├── logs/                  # 실행 로그
├── notebooks/
│   ├── phase1_01_eda.ipynb
│   ├── phase1_02_modeling.ipynb
│   ├── phase1_03_evaluation.ipynb
│   ├── phase2_01_eda.ipynb
│   ├── phase2_02_clustering.ipynb
│   ├── phase2_03_evaluation.ipynb
│   ├── phase3_01_eda.ipynb
│   ├── phase3_02_anomaly.ipynb
│   ├── phase3_03_evaluation.ipynb
│   ├── phase4_01_eda.ipynb
│   ├── phase4_02_timeseries.ipynb
│   ├── phase4_03_evaluation.ipynb
│   └── final_report.ipynb
├── src/
│   ├── config.py          # 전역 설정 (SEED, 경로, 상수)
│   ├── data_collection.py # DART API 수집 + 캐시
│   ├── preprocessing.py   # 결측치/이상치/스케일링
│   ├── feature_engineering.py # 파생변수 생성
│   ├── validation.py      # 데이터 검증
│   ├── models/
│   │   ├── __init__.py
│   │   ├── classifiers.py # Phase 1 분류 모델
│   │   ├── clustering.py  # Phase 2 클러스터링
│   │   ├── anomaly.py     # Phase 3 이상탐지
│   │   ├── timeseries.py  # Phase 4 시계열
│   │   └── deep_learning.py # DNN, AE, LSTM, Transformer
│   ├── evaluation.py      # 평가 + 리더보드
│   ├── explainability.py  # SHAP, Feature Importance, PDP
│   ├── visualization.py   # 공통 시각화 함수
│   └── utils.py           # Rate limiter, 캐시, 로깅 설정
├── tests/
│   ├── test_data_collection.py
│   ├── test_preprocessing.py
│   ├── test_feature_engineering.py
│   ├── test_validation.py
│   └── test_utils.py
├── docs/
├── scripts/
├── .env
├── .gitignore
├── CLAUDE.md
└── requirements.txt
```

## 데이터 흐름
```
DART API → data/raw/ (캐시) → 전처리 → data/processed/ → 모델 학습 → models/
                                                         → 분석/시각화 → notebooks/
```

## Phase 간 데이터 공유
```
data/processed/
├── corp_list.csv          # Phase 1 → 2, 3, 4
├── financial_statements.csv  # Phase 1 → 2, 3
├── financial_ratios.csv   # Phase 1 → 2, 3
├── health_scores.csv      # Phase 1 → 4
├── sector_clusters.csv    # Phase 2
├── anomaly_flags.csv      # Phase 3
└── disclosure_events.csv  # Phase 4
```

## 기술 스택
- Python 3.11+
- pandas, numpy (데이터 처리)
- matplotlib, seaborn, plotly (시각화)
- scikit-learn, xgboost, lightgbm (ML)
- PyTorch, pytorch-tabnet (딥러닝)
- statsmodels, prophet, pmdarima (시계열)
- shap (모델 해석)
- requests, OpenDartReader (API 호출)
- jupyter (분석 노트북)
