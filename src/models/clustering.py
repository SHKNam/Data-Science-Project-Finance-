"""Phase 2 클러스터링 모델 — 9개 모델 전수 비교"""

import logging

import numpy as np
import torch
import torch.nn as nn
from sklearn.cluster import (
    AgglomerativeClustering,
    DBSCAN,
    KMeans,
    MiniBatchKMeans,
    SpectralClustering,
)
from sklearn.metrics import (
    calinski_harabasz_score,
    davies_bouldin_score,
    silhouette_score,
)
from sklearn.mixture import GaussianMixture
from hdbscan import HDBSCAN

from config import RANDOM_SEED

log = logging.getLogger(__name__)


def get_clustering_models(k: int = 4) -> dict:
    """클러스터링 모델 7종 (+ DL 2종은 별도)"""
    return {
        "KMeans": KMeans(n_clusters=k, random_state=RANDOM_SEED, n_init=10),
        "MiniBatchKMeans": MiniBatchKMeans(n_clusters=k, random_state=RANDOM_SEED, n_init=10),
        "DBSCAN": DBSCAN(eps=1.5, min_samples=5),
        "Agglomerative": AgglomerativeClustering(n_clusters=k),
        "GaussianMixture": GaussianMixture(n_components=k, random_state=RANDOM_SEED),
        "Spectral": SpectralClustering(n_clusters=k, random_state=RANDOM_SEED, affinity="nearest_neighbors"),
        "HDBSCAN": HDBSCAN(min_cluster_size=10),
    }


def evaluate_clustering(X: np.ndarray, labels: np.ndarray, name: str) -> dict:
    """클러스터링 평가 지표 계산"""
    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    n_noise = (labels == -1).sum()

    result = {"model": name, "n_clusters": n_clusters, "n_noise": n_noise}

    if n_clusters < 2:
        result["silhouette"] = np.nan
        result["calinski_harabasz"] = np.nan
        result["davies_bouldin"] = np.nan
        log.warning(f"  {name}: 클러스터 {n_clusters}개 — 평가 불가")
        return result

    # noise 제외 평가
    mask = labels != -1
    if mask.sum() < 2:
        result["silhouette"] = np.nan
        result["calinski_harabasz"] = np.nan
        result["davies_bouldin"] = np.nan
        return result

    X_eval = X[mask]
    labels_eval = labels[mask]

    result["silhouette"] = silhouette_score(X_eval, labels_eval)
    result["calinski_harabasz"] = calinski_harabasz_score(X_eval, labels_eval)
    result["davies_bouldin"] = davies_bouldin_score(X_eval, labels_eval)

    log.info(f"  {name}: Silhouette={result['silhouette']:.4f}, CH={result['calinski_harabasz']:.1f}, DB={result['davies_bouldin']:.4f}")
    return result


def run_clustering_leaderboard(X: np.ndarray, k: int = 4) -> tuple[list[dict], dict[str, np.ndarray]]:
    """전체 클러스터링 모델 실행 + 평가"""
    models = get_clustering_models(k)
    results = []
    all_labels = {}

    for name, model in models.items():
        log.info(f"클러스터링: {name}")
        try:
            if name == "GaussianMixture":
                model.fit(X)
                labels = model.predict(X)
            else:
                labels = model.fit_predict(X)

            all_labels[name] = labels
            result = evaluate_clustering(X, labels, name)
            results.append(result)

        except Exception as e:
            log.error(f"  {name} 실패: {e}")
            results.append({"model": name, "silhouette": np.nan, "error": str(e)})

    return results, all_labels


class ClusteringAutoencoder(nn.Module):
    """Autoencoder for latent space clustering"""
    def __init__(self, input_dim: int, latent_dim: int = 8):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, latent_dim),
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 32),
            nn.ReLU(),
            nn.Linear(32, input_dim),
        )

    def forward(self, x):
        z = self.encoder(x)
        return self.decoder(z), z

    def encode(self, x):
        return self.encoder(x)


def autoencoder_clustering(X: np.ndarray, k: int = 4, latent_dim: int = 8,
                            epochs: int = 200) -> tuple[np.ndarray, np.ndarray]:
    """Autoencoder → 잠재 공간 → KMeans 클러스터링"""
    torch.manual_seed(RANDOM_SEED)
    model = ClusteringAutoencoder(X.shape[1], latent_dim)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    X_t = torch.FloatTensor(X)

    model.train()
    for _ in range(epochs):
        optimizer.zero_grad()
        recon, _ = model(X_t)
        loss = nn.MSELoss()(recon, X_t)
        loss.backward()
        optimizer.step()

    model.eval()
    with torch.no_grad():
        latent = model.encode(X_t).numpy()

    kmeans = KMeans(n_clusters=k, random_state=RANDOM_SEED, n_init=10)
    labels = kmeans.fit_predict(latent)
    return labels, latent


def find_optimal_k(X: np.ndarray, k_range: range = range(2, 11)) -> int:
    """Silhouette Score로 최적 k 탐색"""
    best_k, best_score = 2, -1
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=RANDOM_SEED, n_init=10)
        labels = km.fit_predict(X)
        score = silhouette_score(X, labels)
        log.info(f"  k={k}: Silhouette={score:.4f}")
        if score > best_score:
            best_k, best_score = k, score
    log.info(f"  최적 k={best_k} (Silhouette={best_score:.4f})")
    return best_k
