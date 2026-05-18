"""Phase 2 — 클러스터 centroid 계산 + 의미 라벨 자동 부여 + 대표 기업 5개."""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd

os.environ.setdefault("OMP_NUM_THREADS", "1")
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import DATA_PROCESSED, LOGS_DIR  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOGS_DIR / "phase2_cluster_labeling.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

NUMERIC_COLS = [
    "debt_ratio",
    "current_ratio",
    "roe",
    "roa",
    "interest_coverage",
    "operating_margin",
    "altman_z",
    "health_score",
    "log_assets",
]


def label_cluster(centroid: pd.Series, global_mean: pd.Series, global_std: pd.Series) -> str:
    """centroid의 z-score로 가장 두드러진 특성 2개를 골라 한국어 라벨 부여."""
    z = (centroid - global_mean) / global_std.replace(0, np.nan)
    z = z.dropna()
    descriptors = []

    # 우선순위: 부채/유동성/수익성/안정성
    priority = {
        "debt_ratio": ("저부채", "고부채"),
        "current_ratio": ("저유동성", "고유동성"),
        "roe": ("저수익", "고수익"),
        "roa": ("저효율", "고효율"),
        "interest_coverage": ("이자부담", "이자여유"),
        "operating_margin": ("저마진", "고마진"),
        "altman_z": ("재무위험", "재무안정"),
        "health_score": ("저건전성", "고건전성"),
        "log_assets": ("소형", "대형"),
    }
    sorted_feats = z.abs().sort_values(ascending=False).index.tolist()
    for feat in sorted_feats:
        if feat not in priority or abs(z[feat]) < 0.4:
            continue
        low, high = priority[feat]
        descriptors.append(high if z[feat] > 0 else low)
        if len(descriptors) >= 2:
            break

    if not descriptors:
        return "표준형"
    return "·".join(descriptors) + "형"


def main():
    sc = pd.read_csv(DATA_PROCESSED / "sector_clusters.csv", dtype={"corp_code": str})
    sc["corp_code"] = sc["corp_code"].str.zfill(8)

    # 클러스터별 centroid + 크기
    cluster_col = "cluster"
    clusters = sorted(sc[cluster_col].dropna().unique())
    log.info(f"클러스터 수: {len(clusters)}")

    global_mean = sc[NUMERIC_COLS].mean()
    global_std = sc[NUMERIC_COLS].std()

    centroids: list[dict] = []
    labels_meta: dict[str, dict] = {}

    for c in clusters:
        sub = sc[sc[cluster_col] == c]
        centroid = sub[NUMERIC_COLS].mean()
        label = label_cluster(centroid, global_mean, global_std)

        # 대표 기업 5개: centroid에서 가장 가까운 (z 거리)
        feats = sub[NUMERIC_COLS].copy()
        feats_z = (feats - feats.mean()) / feats.std().replace(0, np.nan)
        feats_z = feats_z.fillna(0)
        dist = np.linalg.norm(feats_z.to_numpy(), axis=1)
        rep_idx = np.argsort(dist)[:5]
        reps = sub.iloc[rep_idx][["corp_code", "corp_name", "health_score", "altman_zone"]].to_dict("records")

        row = {"cluster": int(c), "label": label, "size": int(len(sub))}
        for col in NUMERIC_COLS:
            row[col] = float(centroid[col])
        centroids.append(row)

        labels_meta[str(int(c))] = {
            "label": label,
            "size": int(len(sub)),
            "representatives": reps,
            "centroid": {col: float(centroid[col]) for col in NUMERIC_COLS},
        }

        log.info(f"  cluster {c}: {label} (n={len(sub)})")

    pd.DataFrame(centroids).to_csv(DATA_PROCESSED / "phase2_cluster_centroids.csv", index=False)
    (DATA_PROCESSED / "phase2_cluster_labels.json").write_text(
        json.dumps(labels_meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    log.info("저장 완료: phase2_cluster_centroids.csv, phase2_cluster_labels.json")


if __name__ == "__main__":
    main()
