"""Phase 3 이상탐지 모델 — 9개 모델 전수 비교 + 앙상블"""

import logging

import numpy as np
import torch
import torch.nn as nn
from scipy import stats
from sklearn.cluster import DBSCAN
from sklearn.covariance import EllipticEnvelope
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM

from config import RANDOM_SEED

log = logging.getLogger(__name__)


def get_anomaly_models(contamination: float = 0.05) -> dict:
    """이상탐지 모델 5종 (sklearn)"""
    return {
        "IsolationForest": IsolationForest(
            contamination=contamination, random_state=RANDOM_SEED, n_jobs=1,
        ),
        "LOF": LocalOutlierFactor(
            contamination=contamination, novelty=False, n_jobs=1,
        ),
        "OneClassSVM": OneClassSVM(nu=contamination, kernel="rbf"),
        "EllipticEnvelope": EllipticEnvelope(
            contamination=contamination, random_state=RANDOM_SEED,
        ),
        "DBSCAN_anomaly": DBSCAN(eps=2.0, min_samples=5),
    }


def benford_test(series: np.ndarray) -> dict:
    """Benford's Law 검정 — 첫째 자릿수 분포"""
    # 양수만 사용
    vals = np.abs(series[series != 0])
    if len(vals) < 30:
        return {"chi2": np.nan, "p_value": np.nan, "conforms": None}

    first_digits = np.array([int(str(abs(int(v)))[0]) for v in vals if v != 0 and not np.isnan(v)])
    first_digits = first_digits[(first_digits >= 1) & (first_digits <= 9)]

    if len(first_digits) < 30:
        return {"chi2": np.nan, "p_value": np.nan, "conforms": None}

    observed = np.bincount(first_digits, minlength=10)[1:]  # 1~9
    expected_probs = np.log10(1 + 1 / np.arange(1, 10))
    expected = expected_probs * len(first_digits)

    chi2, p_value = stats.chisquare(observed, expected)
    return {
        "chi2": chi2,
        "p_value": p_value,
        "conforms": p_value > 0.05,  # p > 0.05 → Benford 법칙 따름
    }


class DeepAutoencoder(nn.Module):
    """Deep Autoencoder for anomaly detection"""
    def __init__(self, input_dim: int, latent_dim: int = 4):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 32), nn.ReLU(),
            nn.Linear(32, 16), nn.ReLU(),
            nn.Linear(16, latent_dim),
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 16), nn.ReLU(),
            nn.Linear(16, 32), nn.ReLU(),
            nn.Linear(32, input_dim),
        )

    def forward(self, x):
        z = self.encoder(x)
        return self.decoder(z)


def autoencoder_anomaly(X: np.ndarray, contamination: float = 0.05,
                         epochs: int = 200) -> np.ndarray:
    """Autoencoder 재구성 오류 기반 이상탐지"""
    torch.manual_seed(RANDOM_SEED)
    model = DeepAutoencoder(X.shape[1])
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    X_t = torch.FloatTensor(X)

    model.train()
    for _ in range(epochs):
        optimizer.zero_grad()
        recon = model(X_t)
        loss = nn.MSELoss()(recon, X_t)
        loss.backward()
        optimizer.step()

    model.eval()
    with torch.no_grad():
        recon = model(X_t)
        errors = ((X_t - recon) ** 2).mean(dim=1).numpy()

    threshold = np.percentile(errors, (1 - contamination) * 100)
    labels = np.where(errors > threshold, -1, 1)
    return labels


def run_anomaly_leaderboard(X: np.ndarray, contamination: float = 0.05,
                             pseudo_labels: np.ndarray = None) -> tuple[list[dict], dict]:
    """전체 이상탐지 모델 실행"""
    models = get_anomaly_models(contamination)
    results = []
    all_preds = {}

    for name, model in models.items():
        log.info(f"이상탐지: {name}")
        try:
            if name == "LOF":
                preds = model.fit_predict(X)
            elif name == "DBSCAN_anomaly":
                labels = model.fit_predict(X)
                preds = np.where(labels == -1, -1, 1)
            else:
                model.fit(X)
                preds = model.predict(X)

            n_anomaly = (preds == -1).sum()
            all_preds[name] = preds

            result = {"model": name, "n_anomalies": n_anomaly, "anomaly_rate": n_anomaly / len(X)}

            # pseudo-label이 있으면 precision/recall 계산
            if pseudo_labels is not None:
                pred_binary = (preds == -1).astype(int)
                tp = ((pred_binary == 1) & (pseudo_labels == 1)).sum()
                fp = ((pred_binary == 1) & (pseudo_labels == 0)).sum()
                fn = ((pred_binary == 0) & (pseudo_labels == 1)).sum()
                result["precision"] = tp / max(tp + fp, 1)
                result["recall"] = tp / max(tp + fn, 1)

            log.info(f"  {name}: {n_anomaly}건 이상 ({n_anomaly/len(X)*100:.1f}%)")
            results.append(result)

        except Exception as e:
            log.error(f"  {name} 실패: {e}")
            results.append({"model": name, "n_anomalies": 0, "error": str(e)})

    # Deep Autoencoder
    log.info("이상탐지: DeepAutoencoder")
    ae_preds = autoencoder_anomaly(X, contamination)
    n_ae = (ae_preds == -1).sum()
    all_preds["DeepAutoencoder"] = ae_preds
    ae_result = {"model": "DeepAutoencoder", "n_anomalies": n_ae, "anomaly_rate": n_ae / len(X)}
    if pseudo_labels is not None:
        pred_binary = (ae_preds == -1).astype(int)
        tp = ((pred_binary == 1) & (pseudo_labels == 1)).sum()
        fp = ((pred_binary == 1) & (pseudo_labels == 0)).sum()
        fn = ((pred_binary == 0) & (pseudo_labels == 1)).sum()
        ae_result["precision"] = tp / max(tp + fp, 1)
        ae_result["recall"] = tp / max(tp + fn, 1)
    log.info(f"  DeepAutoencoder: {n_ae}건 이상 ({n_ae/len(X)*100:.1f}%)")
    results.append(ae_result)

    return results, all_preds


def ensemble_anomaly(all_preds: dict, threshold: int = 3) -> np.ndarray:
    """다수결 투표 앙상블 — threshold개 이상 모델이 이상으로 판정한 경우"""
    pred_matrix = np.column_stack([(p == -1).astype(int) for p in all_preds.values()])
    votes = pred_matrix.sum(axis=1)
    return votes, (votes >= threshold).astype(int)
