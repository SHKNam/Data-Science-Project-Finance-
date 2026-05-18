"""Cross-phase 교차 분석: 위험 × 이상치 × 클러스터 × 건전성 등급."""

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
        logging.FileHandler(LOGS_DIR / "cross_phase.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


def load(name: str) -> pd.DataFrame:
    df = pd.read_csv(DATA_PROCESSED / name, dtype={"corp_code": str})
    df["corp_code"] = df["corp_code"].str.zfill(8)
    return df


def main():
    ratios = load("financial_ratios.csv")
    clusters = load("sector_clusters.csv")
    anomalies = load("anomaly_flags.csv")

    joined = (
        ratios[["corp_code", "corp_name", "bsns_year", "health_score", "health_grade", "altman_zone"]]
        .merge(clusters[["corp_code", "bsns_year", "cluster"]], on=["corp_code", "bsns_year"], how="left")
        .merge(anomalies[["corp_code", "bsns_year", "risk", "anomaly_votes"]], on=["corp_code", "bsns_year"], how="left")
    )
    joined["risk"] = joined["risk"].fillna(0).astype(int)
    joined["anomaly_votes"] = joined["anomaly_votes"].fillna(0).astype(int)
    joined["cluster"] = joined["cluster"].fillna(-1).astype(int)

    joined.to_csv(DATA_PROCESSED / "cross_phase_summary.csv", index=False)
    log.info(f"cross_phase_summary.csv: {len(joined)} rows")

    # --- 교차표 ---
    crosstabs: dict = {}

    # 1) 위험 라벨 × 이상치 votes
    crosstabs["risk_by_votes"] = pd.crosstab(joined["risk"], joined["anomaly_votes"]).to_dict()

    # 2) 클러스터 × 건전성 등급
    crosstabs["cluster_by_grade"] = (
        pd.crosstab(joined["cluster"], joined["health_grade"]).to_dict()
    )

    # 3) 클러스터별 평균 anomaly_votes / 위험 비율
    grouped = joined.groupby("cluster").agg(
        n=("corp_code", "count"),
        avg_votes=("anomaly_votes", "mean"),
        risk_rate=("risk", "mean"),
        avg_health=("health_score", "mean"),
    )
    crosstabs["cluster_summary"] = grouped.reset_index().to_dict(orient="records")

    # 4) Sankey: 등급 → 클러스터 → 이상치 그룹
    joined["anomaly_group"] = pd.cut(
        joined["anomaly_votes"],
        bins=[-0.1, 0.5, 2.5, 4.5, 6.5],
        labels=["정상", "단일", "다수", "전원"],
    )
    sankey_nodes: list[dict] = []
    sankey_links: list[dict] = []
    node_idx: dict[str, int] = {}

    def get_idx(name: str) -> int:
        if name not in node_idx:
            node_idx[name] = len(sankey_nodes)
            sankey_nodes.append({"name": name})
        return node_idx[name]

    edges_1 = (
        joined.dropna(subset=["health_grade"])
        .groupby(["health_grade", "cluster"], observed=True)
        .size()
        .reset_index(name="value")
    )
    for _, r in edges_1.iterrows():
        src = f"등급:{r['health_grade']}"
        tgt = f"클러스터 {int(r['cluster'])}"
        sankey_links.append({"source": get_idx(src), "target": get_idx(tgt), "value": int(r["value"])})

    edges_2 = (
        joined.dropna(subset=["anomaly_group"])
        .groupby(["cluster", "anomaly_group"], observed=True)
        .size()
        .reset_index(name="value")
    )
    for _, r in edges_2.iterrows():
        src = f"클러스터 {int(r['cluster'])}"
        tgt = f"이상치:{r['anomaly_group']}"
        sankey_links.append({"source": get_idx(src), "target": get_idx(tgt), "value": int(r["value"])})

    sankey = {"nodes": sankey_nodes, "links": sankey_links}

    # --- 자동 인사이트 ---
    insights = []
    if joined["risk"].sum() > 0:
        risk_df = joined[joined["risk"] == 1]
        avg_v = float(risk_df["anomaly_votes"].mean())
        insights.append(
            f"위험 기업 {len(risk_df)}곳의 평균 이상치 votes는 {avg_v:.2f}로, 전체 평균 {float(joined['anomaly_votes'].mean()):.2f}보다 {'높음' if avg_v > joined['anomaly_votes'].mean() else '낮음'}."
        )

    top_cluster = grouped.sort_values("avg_votes", ascending=False).head(1)
    if not top_cluster.empty:
        c = int(top_cluster.index[0])
        v = float(top_cluster["avg_votes"].iloc[0])
        insights.append(f"클러스터 {c}의 평균 이상치 votes가 {v:.2f}로 가장 높아 주의가 필요함.")

    susp = joined[joined["anomaly_votes"] >= 4]
    insights.append(
        f"이상치 votes ≥ 4 기업이 {len(susp)}곳 — 다수 모델이 합의한 의심 대상."
    )

    out = {
        "crosstabs": crosstabs,
        "sankey": sankey,
        "insights": insights,
    }
    (DATA_PROCESSED / "cross_phase_summary.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2, default=str), encoding="utf-8"
    )
    log.info(f"cross_phase_summary.json 저장. 인사이트 {len(insights)}개")


if __name__ == "__main__":
    main()
