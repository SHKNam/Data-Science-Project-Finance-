"""CSV/JSON → dashboard/public/data/*.json 변환.

CRITICAL: corp_code는 항상 문자열, 8자리 zero-pad.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PROCESSED = PROJECT_ROOT / "data" / "processed"
MODELS_DIR = PROJECT_ROOT / "models"
OUT = PROJECT_ROOT / "dashboard" / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def load_csv(name: str, base: Path = DATA_PROCESSED) -> pd.DataFrame:
    df = pd.read_csv(base / name, dtype={"corp_code": str} if "corp_code" not in {""} else None)
    if "corp_code" in df.columns:
        df["corp_code"] = df["corp_code"].astype(str).str.zfill(8)
    return df


def to_records(df: pd.DataFrame) -> list[dict]:
    df = df.replace({np.nan: None})
    return df.to_dict(orient="records")


def write_json(name: str, data) -> None:
    path = OUT / name
    path.write_text(json.dumps(data, ensure_ascii=False, default=str), encoding="utf-8")
    print(f"  ✓ {name} ({path.stat().st_size // 1024} KB)")


def main() -> None:
    print(f"Export start → {OUT}")

    # --- Leaderboards ---
    write_json("phase1_leaderboard.json", to_records(load_csv("phase1_leaderboard.csv", MODELS_DIR)))
    write_json("phase2_leaderboard.json", to_records(load_csv("phase2_leaderboard.csv", MODELS_DIR)))
    write_json("phase3_leaderboard.json", to_records(load_csv("phase3_leaderboard.csv", MODELS_DIR)))
    write_json("phase4_leaderboard.json", to_records(load_csv("phase4_leaderboard.csv", MODELS_DIR)))

    # --- Phase 1 explainability artifacts (JSON files passthrough) ---
    for name in (
        "phase1_roc_curves.json",
        "phase1_pr_curves.json",
        "phase1_confusion_matrices.json",
        "phase1_learning_curves.json",
    ):
        src = DATA_PROCESSED / name
        if src.exists():
            (OUT / name).write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
            print(f"  ✓ {name} (copied)")

    if (DATA_PROCESSED / "phase1_shap_values.csv").exists():
        write_json("phase1_shap_values.json", to_records(load_csv("phase1_shap_values.csv")))
    if (DATA_PROCESSED / "phase1_feature_importance.csv").exists():
        write_json("phase1_feature_importance.json", to_records(load_csv("phase1_feature_importance.csv")))
    if (DATA_PROCESSED / "phase1_meta.csv").exists():
        write_json("phase1_meta.json", to_records(load_csv("phase1_meta.csv")))

    # --- Phase 2 ---
    write_json("phase2_cluster_centroids.json", to_records(load_csv("phase2_cluster_centroids.csv")))
    src = DATA_PROCESSED / "phase2_cluster_labels.json"
    if src.exists():
        (OUT / "phase2_cluster_labels.json").write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
        print("  ✓ phase2_cluster_labels.json (copied)")

    # sector_clusters: 791 rows — main scatter data
    write_json("sector_clusters.json", to_records(load_csv("sector_clusters.csv")))
    write_json("sector_ranking.json", to_records(load_csv("sector_ranking.csv")))

    # --- Phase 1 main datasets ---
    write_json("financial_ratios.json", to_records(load_csv("financial_ratios.csv")))
    write_json("health_scores.json", to_records(load_csv("health_scores.csv")))

    # --- Phase 3 ---
    write_json("anomaly_flags.json", to_records(load_csv("anomaly_flags.csv")))
    write_json("phase3_benford_results.json", to_records(load_csv("phase3_benford_results.csv")))
    write_json("phase3_benford_suspicious.json", to_records(load_csv("phase3_benford_suspicious.csv")))

    # --- Phase 4 ---
    write_json("disclosure_monthly.json", to_records(load_csv("disclosure_monthly.csv")))
    write_json("phase4_forecasts.json", to_records(load_csv("phase4_forecasts.csv")))
    write_json("phase4_decomposition.json", to_records(load_csv("phase4_decomposition.csv")))
    write_json("phase4_summary.json", to_records(load_csv("phase4_summary.csv", MODELS_DIR)))

    # --- Disclosure events: 너무 큼 → 요약만 ---
    ev = load_csv("disclosure_events.csv")
    summary = {
        "total": int(len(ev)),
        "by_year_month": (
            ev.assign(ym=ev["rcept_dt"].astype(str).str.slice(0, 6))
            .groupby("ym").size().rename("count").reset_index().to_dict(orient="records")
        ),
        "by_report_type": ev["report_type"].value_counts().head(15).to_dict() if "report_type" in ev.columns else {},
        "by_corp": (
            ev.groupby(["corp_code", "corp_name"], as_index=False).size()
            .rename(columns={"size": "count"}).sort_values("count", ascending=False).head(50).to_dict(orient="records")
        ),
    }
    write_json("disclosure_summary.json", summary)

    # 기업별 공시 타임라인 (워치리스트 후보가 될 수 있는 상위 200개만)
    top_corps = (
        ev.groupby("corp_code").size().sort_values(ascending=False).head(200).index.tolist()
    )
    timelines: dict[str, list[dict]] = {}
    for code in top_corps:
        sub = ev[ev["corp_code"] == code].sort_values("rcept_dt").tail(50)
        timelines[code] = sub[["rcept_dt", "report_nm", "report_type"]].astype(str).to_dict(orient="records")
    write_json("disclosure_timelines.json", timelines)

    # --- Cross-phase ---
    write_json("cross_phase_summary.json",
               json.loads((DATA_PROCESSED / "cross_phase_summary.json").read_text(encoding="utf-8")))
    write_json("cross_phase_data.json", to_records(load_csv("cross_phase_summary.csv")))

    # --- Models catalog (수동 작성) ---
    models_catalog = {
        "phase1": {
            "title": "Phase 1 · 재무건전성 분류",
            "task": "분류 (Risk vs Safe)",
            "validation": "70/15/15 split + StratifiedKFold 5-fold",
            "imbalance_strategy": ["class_weight=balanced", "SMOTE", "pos_weight (PyTorch)", "scale_pos_weight=10 (XGBoost)"],
            "models": [
                {"id": "LogisticRegression", "library": "sklearn.linear_model", "params": "max_iter=1000, class_weight='balanced'", "file": "src/models/classifiers.py:34"},
                {"id": "KNN", "library": "sklearn.neighbors", "params": "n_neighbors=5", "file": "src/models/classifiers.py:37"},
                {"id": "DecisionTree", "library": "sklearn.tree", "params": "class_weight='balanced'", "file": "src/models/classifiers.py:38"},
                {"id": "RandomForest", "library": "sklearn.ensemble", "params": "n_estimators=100, class_weight='balanced'", "file": "src/models/classifiers.py:41"},
                {"id": "GradientBoosting", "library": "sklearn.ensemble", "params": "n_estimators=100", "file": "src/models/classifiers.py:44"},
                {"id": "AdaBoost", "library": "sklearn.ensemble", "params": "n_estimators=100", "file": "src/models/classifiers.py:47"},
                {"id": "XGBoost", "library": "xgboost", "params": "n_estimators=100, scale_pos_weight=10, nthread=1, tree_method='hist'", "file": "src/models/classifiers.py:50"},
                {"id": "LightGBM", "library": "lightgbm", "params": "n_estimators=100, class_weight='balanced', n_jobs=1", "file": "src/models/classifiers.py:57"},
                {"id": "SVC_rbf", "library": "sklearn.svm", "params": "kernel='rbf', class_weight='balanced'", "file": "src/models/classifiers.py:62"},
                {"id": "GaussianNB", "library": "sklearn.naive_bayes", "params": "기본값", "file": "src/models/classifiers.py:66"},
                {"id": "MLP", "library": "sklearn.neural_network", "params": "(64,32), early_stopping=True", "file": "src/models/classifiers.py:67"},
                {"id": "DNN", "library": "PyTorch", "params": "FC 128→64→32, BN+Dropout(0.3), 100 epochs", "file": "src/models/classifiers.py:76"},
                {"id": "CNN1D", "library": "PyTorch", "params": "Conv1d×2 + AdaptiveAvgPool, 100 epochs", "file": "src/models/classifiers.py:100"},
                {"id": "TabNet", "library": "pytorch-tabnet", "params": "50 epochs, patience=10", "file": "src/models/classifiers.py:177"},
                {"id": "VotingEnsemble", "library": "sklearn.ensemble.VotingClassifier", "params": "soft voting (top 3)", "file": "src/models/classifiers.py:229"},
                {"id": "StackingEnsemble", "library": "sklearn.ensemble.StackingClassifier", "params": "LR meta, cv=5", "file": "src/models/classifiers.py:223"},
            ],
        },
        "phase2": {
            "title": "Phase 2 · 업종 클러스터링",
            "task": "비지도 클러스터링",
            "validation": "Silhouette / Calinski-Harabasz / Davies-Bouldin (비지도)",
            "k_selection": "Silhouette Score 최대값 (k=2)",
            "models": [
                {"id": "KMeans", "library": "sklearn.cluster", "params": "k=2, n_init=10", "file": "src/models/clustering.py:31"},
                {"id": "MiniBatchKMeans", "library": "sklearn.cluster", "params": "k=2, n_init=10", "file": "src/models/clustering.py:32"},
                {"id": "DBSCAN", "library": "sklearn.cluster", "params": "eps=1.5, min_samples=5", "file": "src/models/clustering.py:33"},
                {"id": "Agglomerative", "library": "sklearn.cluster", "params": "k=2", "file": "src/models/clustering.py:34"},
                {"id": "GaussianMixture", "library": "sklearn.mixture", "params": "n_components=2", "file": "src/models/clustering.py:35"},
                {"id": "Spectral", "library": "sklearn.cluster", "params": "k=2, affinity='nearest_neighbors'", "file": "src/models/clustering.py:36"},
                {"id": "HDBSCAN", "library": "hdbscan", "params": "min_cluster_size=10", "file": "src/models/clustering.py:37"},
                {"id": "AE+KMeans", "library": "PyTorch + sklearn", "params": "latent=8, 200 epochs → KMeans k=2", "file": "src/models/clustering.py:127"},
            ],
        },
        "phase3": {
            "title": "Phase 3 · 이상탐지",
            "task": "비지도 이상탐지 + Benford's Law",
            "validation": "pseudo-label 부재 → 7개 모델 앙상블 합의 (votes 기반)",
            "contamination": 0.05,
            "models": [
                {"id": "IsolationForest", "library": "sklearn.ensemble", "params": "contamination=0.05", "file": "src/models/anomaly.py:23"},
                {"id": "LOF", "library": "sklearn.neighbors", "params": "contamination=0.05", "file": "src/models/anomaly.py:26"},
                {"id": "OneClassSVM", "library": "sklearn.svm", "params": "nu=0.05, kernel='rbf'", "file": "src/models/anomaly.py:29"},
                {"id": "EllipticEnvelope", "library": "sklearn.covariance", "params": "contamination=0.05", "file": "src/models/anomaly.py:30"},
                {"id": "DBSCAN_anomaly", "library": "sklearn.cluster", "params": "eps=2.0, min_samples=5", "file": "src/models/anomaly.py:33"},
                {"id": "DeepAutoencoder", "library": "PyTorch", "params": "input→32→16→4→16→32→input, 200 epochs", "file": "src/models/anomaly.py:62"},
                {"id": "Ensemble", "library": "다수결 투표", "params": "threshold=3 (모델 ≥3개 동의 시 이상)", "file": "src/models/anomaly.py:167"},
            ],
        },
        "phase4": {
            "title": "Phase 4 · 공시 시계열 예측",
            "task": "단변량 시계열 예측",
            "validation": "처음 30개월 학습 / 마지막 6개월 테스트, RMSE/MAE/MAPE",
            "data": "disclosure_monthly.csv (2023-01 ~ 2025-12)",
            "models": [
                {"id": "ARIMA", "library": "statsmodels", "params": "order=(2,1,1)", "file": "src/phase4_timeseries.py:fit_arima"},
                {"id": "Prophet", "library": "prophet", "params": "기본 (월별)", "file": "src/phase4_timeseries.py:fit_prophet"},
                {"id": "LSTM", "library": "PyTorch", "params": "hidden=32, window=6, 300 epochs", "file": "src/phase4_timeseries.py:LSTMModel"},
                {"id": "GRU", "library": "PyTorch", "params": "hidden=32, window=6, 300 epochs", "file": "src/phase4_timeseries.py:GRUModel"},
                {"id": "Transformer", "library": "PyTorch", "params": "d_model=32, heads=4, layers=2", "file": "src/phase4_timeseries.py:TFModel"},
            ],
        },
    }
    write_json("models_catalog.json", models_catalog)

    # --- Datasets catalog ---
    datasets_catalog = []
    DATASETS = [
        ("financial_ratios.csv", "재무비율 + Altman Z + 건전성 점수", "Phase 1 feature"),
        ("health_scores.csv", "건전성 점수와 등급 (우량/보통/주의/위험)", "Phase 1 결과"),
        ("sector_clusters.csv", "업종 클러스터 + PCA 좌표", "Phase 2 결과"),
        ("sector_ranking.csv", "업종 내 기업 랭킹 (Top 20)", "Phase 2 결과"),
        ("anomaly_flags.csv", "기업별 이상치 votes + 위험 라벨", "Phase 3 결과"),
        ("disclosure_events.csv", "공시 이벤트 (120K)", "Phase 4 원본"),
        ("disclosure_monthly.csv", "월별 공시 건수 집계", "Phase 4 시계열"),
        ("phase4_forecasts.csv", "ARIMA/Prophet/LSTM/GRU/Transformer 예측", "Phase 4 결과"),
        ("phase4_decomposition.csv", "trend/seasonal/residual 분해", "Phase 4 분석"),
        ("phase3_benford_results.csv", "Benford 자릿수 분포 + 카이제곱", "Phase 3 분석"),
        ("phase3_benford_suspicious.csv", "Benford KL divergence 상위 50개", "Phase 3 분석"),
        ("cross_phase_summary.csv", "위험×이상치×클러스터 통합", "교차 분석"),
    ]
    for name, desc, source in DATASETS:
        path = DATA_PROCESSED / name
        if not path.exists():
            continue
        try:
            df = pd.read_csv(path, nrows=5, dtype={"corp_code": str})
            full = pd.read_csv(path, dtype={"corp_code": str})
            datasets_catalog.append(
                {
                    "name": name,
                    "description": desc,
                    "source": source,
                    "rows": int(len(full)),
                    "columns": list(df.columns),
                    "n_columns": int(len(df.columns)),
                    "missing_rate": float(full.isna().mean().mean()),
                    "sample": df.replace({np.nan: None}).to_dict(orient="records"),
                }
            )
        except Exception as e:
            print(f"  skip {name}: {e}")
    write_json("datasets_catalog.json", datasets_catalog)

    # --- Meta / build info ---
    meta = {
        "generated_at": datetime.now().isoformat(),
        "project_root": str(PROJECT_ROOT),
        "n_companies": 791,
        "n_models": 37,
        "n_disclosures": 120000,
        "data_source": "DART OpenAPI (https://opendart.fss.or.kr)",
    }
    write_json("meta.json", meta)

    print(f"Done. Files: {len(list(OUT.glob('*.json')))}")


if __name__ == "__main__":
    main()
