"""Phase 1 Explainability — 16 모델 재학습 후 ROC/PR/혼동행렬/SHAP/Feature Importance 저장."""

from __future__ import annotations

import json
import logging
import os
import sys
import time
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn

warnings.filterwarnings("ignore")
os.environ.setdefault("OMP_NUM_THREADS", "1")

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import DATA_PROCESSED, DATA_RAW, MODELS_DIR, LOGS_DIR, RANDOM_SEED, TEST_SIZE  # noqa: E402
from models.classifiers import get_all_models  # noqa: E402

from sklearn.metrics import (  # noqa: E402
    confusion_matrix,
    precision_recall_curve,
    roc_curve,
)
from sklearn.model_selection import train_test_split  # noqa: E402
from sklearn.preprocessing import StandardScaler  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOGS_DIR / "phase1_explainability.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

FEATURES = [
    "debt_ratio",
    "current_ratio",
    "roe",
    "roa",
    "interest_coverage",
    "operating_margin",
    "altman_z",
    "log_assets",
]


def load_dataset() -> tuple[np.ndarray, np.ndarray, list[str], pd.DataFrame]:
    """ratios + risk_labels를 corp_code 문자열 보존하며 병합."""
    ratios = pd.read_csv(DATA_PROCESSED / "financial_ratios.csv", dtype={"corp_code": str})
    ratios["corp_code"] = ratios["corp_code"].str.zfill(8)

    labels = pd.read_csv(DATA_RAW / "risk_labels_all.csv", dtype={"corp_code": str})
    labels["corp_code"] = labels["corp_code"].str.zfill(8)
    labels["risk"] = (
        labels[["bankruptcy", "suspension", "rehabilitation"]].sum(axis=1) > 0
    ).astype(int)

    merged = ratios.merge(
        labels[["corp_code", "bsns_year", "risk"]],
        on=["corp_code", "bsns_year"],
        how="inner",
    )
    merged = merged.dropna(subset=FEATURES)

    X = merged[FEATURES].astype(float).to_numpy()
    y = merged["risk"].astype(int).to_numpy()

    log.info(f"데이터셋: {X.shape}, 양성: {y.sum()} ({y.mean()*100:.2f}%)")
    return X, y, FEATURES, merged.reset_index(drop=True)


def to_jsonable(obj):
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    raise TypeError(f"unserializable: {type(obj)}")


def main():
    np.random.seed(RANDOM_SEED)
    torch.manual_seed(RANDOM_SEED)

    X, y, feature_names, df = load_dataset()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )

    scaler = StandardScaler().fit(X_train)
    X_train_s = scaler.transform(X_train)
    X_test_s = scaler.transform(X_test)

    log.info(f"Train: {X_train_s.shape}, Test: {X_test_s.shape}")

    models = get_all_models(input_dim=X_train_s.shape[1])

    roc_curves: dict[str, dict] = {}
    pr_curves: dict[str, dict] = {}
    confusion: dict[str, dict] = {}
    metrics_extra: list[dict] = []
    learning_curves: dict[str, list] = {}

    for name, model in models.items():
        log.info(f"── {name}")
        try:
            t0 = time.time()
            # PyTorch wrappers expose .fit but we want per-epoch loss for learning curve
            if name in {"DNN", "CNN1D"}:
                _fit_pytorch_with_curve(model, X_train_s, y_train, learning_curves, name)
            else:
                model.fit(X_train_s, y_train)
            train_time = time.time() - t0

            try:
                y_proba = model.predict_proba(X_test_s)[:, 1]
            except Exception:
                if hasattr(model, "decision_function"):
                    raw = model.decision_function(X_test_s)
                    y_proba = (raw - raw.min()) / (raw.max() - raw.min() + 1e-12)
                else:
                    y_proba = model.predict(X_test_s).astype(float)

            y_pred = model.predict(X_test_s)
            cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
            confusion[name] = {
                "tn": int(cm[0, 0]),
                "fp": int(cm[0, 1]),
                "fn": int(cm[1, 0]),
                "tp": int(cm[1, 1]),
            }

            if len(np.unique(y_test)) > 1:
                fpr, tpr, _ = roc_curve(y_test, y_proba)
                pr, rc, _ = precision_recall_curve(y_test, y_proba)
                roc_curves[name] = {"fpr": _down(fpr), "tpr": _down(tpr)}
                pr_curves[name] = {"precision": _down(pr), "recall": _down(rc)}

            metrics_extra.append(
                {
                    "model": name,
                    "train_time_sec": round(train_time, 3),
                    "n_test_pos": int(y_test.sum()),
                    "n_test_neg": int((y_test == 0).sum()),
                }
            )
            log.info(f"  ✓ {name} ({train_time:.1f}s)")

        except Exception as e:
            log.exception(f"  ✗ {name}: {e}")

    # --- SHAP + Feature Importance for AdaBoost (best model from prior run) ---
    shap_summary, fi = _compute_explanations(models.get("AdaBoost"), X_train_s, X_test_s, feature_names)

    # --- Save artifacts ---
    out_dir = DATA_PROCESSED
    (out_dir / "phase1_roc_curves.json").write_text(
        json.dumps(roc_curves, default=to_jsonable), encoding="utf-8"
    )
    (out_dir / "phase1_pr_curves.json").write_text(
        json.dumps(pr_curves, default=to_jsonable), encoding="utf-8"
    )
    (out_dir / "phase1_confusion_matrices.json").write_text(
        json.dumps(confusion, default=to_jsonable), encoding="utf-8"
    )
    (out_dir / "phase1_learning_curves.json").write_text(
        json.dumps(learning_curves, default=to_jsonable), encoding="utf-8"
    )

    if shap_summary is not None:
        shap_summary.to_csv(out_dir / "phase1_shap_values.csv", index=False)
    if fi is not None:
        fi.to_csv(out_dir / "phase1_feature_importance.csv", index=False)

    pd.DataFrame(metrics_extra).to_csv(out_dir / "phase1_meta.csv", index=False)

    log.info("Phase 1 explainability 산출물 저장 완료")
    log.info(f"  ROC curves: {len(roc_curves)}")
    log.info(f"  PR curves:  {len(pr_curves)}")
    log.info(f"  Confusion:  {len(confusion)}")
    log.info(f"  Learning:   {list(learning_curves.keys())}")


def _down(arr: np.ndarray, max_points: int = 100) -> list[float]:
    """ROC/PR 좌표를 최대 max_points로 다운샘플."""
    arr = np.asarray(arr, dtype=float)
    if len(arr) <= max_points:
        return arr.tolist()
    idx = np.linspace(0, len(arr) - 1, max_points).astype(int)
    return arr[idx].tolist()


def _fit_pytorch_with_curve(wrapper, X, y, store: dict, name: str):
    """PyTorchClassifierWrapper.fit을 epoch loss 기록 버전으로 재구현."""
    torch.manual_seed(RANDOM_SEED)
    device = wrapper.device
    X_t = torch.FloatTensor(np.asarray(X)).to(device)
    y_t = torch.FloatTensor(np.asarray(y)).to(device)
    n_pos = float(y_t.sum().item())
    n_neg = float(len(y_t) - n_pos)
    pos_weight = torch.tensor([n_neg / max(n_pos, 1)], device=device)

    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    opt = torch.optim.Adam(wrapper.model.parameters(), lr=wrapper.lr)
    ds = torch.utils.data.TensorDataset(X_t, y_t)
    loader = torch.utils.data.DataLoader(ds, batch_size=wrapper.batch_size, shuffle=True)

    losses: list[float] = []
    wrapper.model.train()
    for epoch in range(wrapper.epochs):
        epoch_loss = 0.0
        for xb, yb in loader:
            opt.zero_grad()
            out = wrapper.model(xb).squeeze()
            loss = criterion(out, yb)
            loss.backward()
            opt.step()
            epoch_loss += float(loss.item())
        losses.append(epoch_loss / max(len(loader), 1))
    store[name] = losses


def _compute_explanations(model, X_train, X_test, feature_names):
    """SHAP + feature importance — 실패 시 None."""
    if model is None:
        return None, None
    try:
        import shap

        # AdaBoost의 SHAP은 KernelExplainer가 적합 — 작은 배경 샘플로 제한
        bg = X_train[np.random.choice(len(X_train), size=min(50, len(X_train)), replace=False)]
        sample = X_test[: min(80, len(X_test))]
        explainer = shap.KernelExplainer(lambda x: model.predict_proba(x)[:, 1], bg)
        values = explainer.shap_values(sample, nsamples=64, silent=True)
        mean_abs = np.abs(values).mean(axis=0)
        shap_summary = pd.DataFrame(
            {"feature": feature_names, "mean_abs_shap": mean_abs}
        ).sort_values("mean_abs_shap", ascending=False)
    except Exception as e:
        log.warning(f"SHAP 계산 실패: {e}")
        shap_summary = None

    fi = None
    if hasattr(model, "feature_importances_"):
        fi = pd.DataFrame(
            {"feature": feature_names, "importance": model.feature_importances_}
        ).sort_values("importance", ascending=False)
    return shap_summary, fi


if __name__ == "__main__":
    main()
