"""모델 평가 + 리더보드 생성 모듈"""

import logging
import time
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score

from config import LOGS_DIR, MODELS_DIR, RANDOM_SEED

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOGS_DIR / "evaluation.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


def evaluate_single_model(
    model: Any,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    model_name: str,
) -> dict:
    """단일 모델 학습 + 평가 → 지표 dict 반환"""
    log.info(f"학습 시작: {model_name}")
    start = time.time()

    try:
        model.fit(X_train, y_train)
        train_time = time.time() - start

        y_pred = model.predict(X_test)

        # AUC-ROC (predict_proba 지원 모델만)
        auc = np.nan
        try:
            y_proba = model.predict_proba(X_test)[:, 1]
            if len(np.unique(y_test)) > 1:
                auc = roc_auc_score(y_test, y_proba)
        except Exception:
            pass

        metrics = {
            "model": model_name,
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred, zero_division=0),
            "recall": recall_score(y_test, y_pred, zero_division=0),
            "f1": f1_score(y_test, y_pred, zero_division=0),
            "auc_roc": auc,
            "train_time_sec": round(train_time, 2),
        }

        log.info(
            f"  {model_name}: F1={metrics['f1']:.4f}, AUC={auc:.4f}, "
            f"Time={train_time:.1f}s"
        )
        return metrics

    except Exception as e:
        log.error(f"  {model_name} 실패: {e}")
        return {
            "model": model_name,
            "accuracy": np.nan,
            "precision": np.nan,
            "recall": np.nan,
            "f1": np.nan,
            "auc_roc": np.nan,
            "train_time_sec": np.nan,
            "error": str(e),
        }


def run_leaderboard(
    models: dict[str, Any],
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> pd.DataFrame:
    """전체 모델 학습 + 평가 → 리더보드 DataFrame 반환"""
    results = []

    for name, model in models.items():
        metrics = evaluate_single_model(model, X_train, y_train, X_test, y_test, name)
        results.append(metrics)

    leaderboard = pd.DataFrame(results)
    leaderboard = leaderboard.sort_values("f1", ascending=False).reset_index(drop=True)
    leaderboard.index += 1  # 1부터 시작
    leaderboard.index.name = "rank"

    log.info(f"\n{'='*60}\n리더보드:\n{leaderboard.to_string()}\n{'='*60}")
    return leaderboard


def cross_validate_model(
    model: Any,
    X: np.ndarray,
    y: np.ndarray,
    cv: int = 5,
    scoring: str = "f1",
) -> dict:
    """교차검증 수행"""
    skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=RANDOM_SEED)
    scores = cross_val_score(model, X, y, cv=skf, scoring=scoring)
    return {
        "mean": scores.mean(),
        "std": scores.std(),
        "scores": scores.tolist(),
    }


def save_best_model(model: Any, name: str, leaderboard: pd.DataFrame):
    """최적 모델 저장"""
    MODELS_DIR.mkdir(exist_ok=True)
    path = MODELS_DIR / f"best_{name}.joblib"
    joblib.dump(model, path)
    log.info(f"모델 저장: {path}")

    # 리더보드도 저장
    lb_path = MODELS_DIR / "phase1_leaderboard.csv"
    leaderboard.to_csv(lb_path)
    log.info(f"리더보드 저장: {lb_path}")
