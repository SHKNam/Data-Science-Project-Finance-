"""Phase 3 — Benford's Law 분석: 자릿수 분포 + 카이제곱 + 기업별 KL divergence."""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

os.environ.setdefault("OMP_NUM_THREADS", "1")
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import DATA_PROCESSED, LOGS_DIR  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOGS_DIR / "phase3_benford.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

TARGET_COLS = ["revenue", "total_assets", "net_income", "operating_income"]
EXPECTED = np.log10(1 + 1 / np.arange(1, 10))  # Benford 기대 분포 (1~9)


def first_digit(x: float) -> int:
    if x is None or pd.isna(x) or x == 0:
        return 0
    s = str(abs(float(x)))
    for ch in s:
        if ch.isdigit() and ch != "0":
            return int(ch)
    return 0


def main():
    fr = pd.read_csv(DATA_PROCESSED / "financial_ratios.csv", dtype={"corp_code": str})
    fr["corp_code"] = fr["corp_code"].str.zfill(8)

    results = []
    for col in TARGET_COLS:
        digits = fr[col].dropna().apply(first_digit)
        digits = digits[(digits >= 1) & (digits <= 9)]
        if len(digits) < 30:
            log.warning(f"{col}: 표본 부족 ({len(digits)})")
            continue
        observed_counts = np.bincount(digits, minlength=10)[1:10]
        n = observed_counts.sum()
        actual_prop = observed_counts / n
        expected_counts = EXPECTED * n
        chi2, p = stats.chisquare(observed_counts, expected_counts)

        log.info(f"{col}: n={n}, chi2={chi2:.2f}, p={p:.4f}, conforms={p>0.05}")
        for d in range(1, 10):
            results.append(
                {
                    "column": col,
                    "digit": int(d),
                    "expected_prop": float(EXPECTED[d - 1]),
                    "actual_prop": float(actual_prop[d - 1]),
                    "expected_count": float(expected_counts[d - 1]),
                    "actual_count": int(observed_counts[d - 1]),
                    "chi2": float(chi2),
                    "p_value": float(p),
                    "conforms": bool(p > 0.05),
                }
            )

    pd.DataFrame(results).to_csv(DATA_PROCESSED / "phase3_benford_results.csv", index=False)
    log.info(f"phase3_benford_results.csv 저장 ({len(results)} rows)")

    # --- 기업별 KL divergence (revenue 기준) — 의심 기업 후보 ---
    # 한 기업당 4개 컬럼의 첫자리 → 총 4개 표본밖에 안 됨. 의미 있는 KL는 어렵다.
    # 대신 4개 컬럼 첫자리 분포를 기업별로 집계해서 expected 대비 절대편차의 합으로 점수화.
    rows = []
    for _, r in fr.iterrows():
        digits = [first_digit(r[c]) for c in TARGET_COLS]
        digits = [d for d in digits if 1 <= d <= 9]
        if not digits:
            continue
        cnt = np.bincount(digits, minlength=10)[1:10].astype(float)
        prop = cnt / cnt.sum()
        # smoothed KL
        eps = 1e-3
        prop_s = (prop + eps) / (prop + eps).sum()
        kl = float(np.sum(prop_s * np.log(prop_s / EXPECTED)))
        rows.append(
            {
                "corp_code": r["corp_code"],
                "corp_name": r.get("corp_name", ""),
                "bsns_year": int(r.get("bsns_year", 0)) if pd.notna(r.get("bsns_year")) else 0,
                "n_digits": int(cnt.sum()),
                "kl_divergence": kl,
            }
        )

    sus = pd.DataFrame(rows).sort_values("kl_divergence", ascending=False).head(50)
    sus.to_csv(DATA_PROCESSED / "phase3_benford_suspicious.csv", index=False)
    log.info(f"phase3_benford_suspicious.csv 저장 (top 50)")


if __name__ == "__main__":
    main()
