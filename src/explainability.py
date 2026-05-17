"""모델 해석성 모듈 — SHAP, Feature Importance, PDP"""

import logging
from typing import Any

import numpy as np
import pandas as pd
import shap
from sklearn.inspection import permutation_importance

from config import LOGS_DIR, MODELS_DIR

log = logging.getLogger(__name__)


def compute_shap_values(model: Any, X: np.ndarray, feature_names: list[str],
                         model_name: str = "model") -> shap.Explanation:
    """SHAP values 계산"""
    log.info(f"SHAP 계산 시작: {model_name}")
    try:
        if hasattr(model, "predict_proba"):
            explainer = shap.Explainer(model.predict_proba, X, feature_names=feature_names)
        else:
            explainer = shap.Explainer(model, X, feature_names=feature_names)
        shap_values = explainer(X)
        log.info(f"SHAP 계산 완료: {model_name}")
        return shap_values
    except Exception as e:
        log.warning(f"SHAP 계산 실패 ({model_name}): {e} — TreeExplainer 시도")
        try:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X)
            return shap_values
        except Exception as e2:
            log.error(f"SHAP 완전 실패 ({model_name}): {e2}")
            return None


def compute_feature_importance(model: Any, feature_names: list[str]) -> pd.DataFrame:
    """트리 기반 모델에서 feature importance 추출"""
    if hasattr(model, "feature_importances_"):
        importance = model.feature_importances_
    elif hasattr(model, "coef_"):
        importance = np.abs(model.coef_).flatten()
    else:
        log.warning("feature_importances_ 미지원 모델")
        return pd.DataFrame()

    df = pd.DataFrame({
        "feature": feature_names,
        "importance": importance,
    }).sort_values("importance", ascending=False).reset_index(drop=True)

    return df


def compute_permutation_importance(model: Any, X: np.ndarray, y: np.ndarray,
                                     feature_names: list[str], n_repeats: int = 10) -> pd.DataFrame:
    """Permutation Importance 계산 (모델 무관)"""
    from config import RANDOM_SEED
    result = permutation_importance(model, X, y, n_repeats=n_repeats,
                                     random_state=RANDOM_SEED, scoring="f1")
    df = pd.DataFrame({
        "feature": feature_names,
        "importance_mean": result.importances_mean,
        "importance_std": result.importances_std,
    }).sort_values("importance_mean", ascending=False).reset_index(drop=True)

    return df
