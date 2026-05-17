"""Feature Engineering 모듈 — Phase 1: Financial Health Scoring"""

import logging

import numpy as np
import pandas as pd

from config import DATA_PROCESSED, LOGS_DIR

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOGS_DIR / "feature_engineering.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


def compute_financial_ratios(df: pd.DataFrame) -> pd.DataFrame:
    """재무 비율 지표 계산"""
    df = df.copy()

    # 부채비율 (부채/자본 × 100)
    df["debt_ratio"] = np.where(
        df["total_equity"] != 0,
        df["total_liabilities"] / df["total_equity"] * 100,
        np.nan,
    )

    # 유동비율 (유동자산/유동부채 × 100)
    df["current_ratio"] = np.where(
        df["current_liabilities"] != 0,
        df["current_assets"] / df["current_liabilities"] * 100,
        np.nan,
    )

    # ROE (당기순이익/자본 × 100)
    df["roe"] = np.where(
        df["total_equity"] != 0,
        df["net_income"] / df["total_equity"] * 100,
        np.nan,
    )

    # ROA (당기순이익/자산 × 100)
    df["roa"] = np.where(
        df["total_assets"] != 0,
        df["net_income"] / df["total_assets"] * 100,
        np.nan,
    )

    # 이자보상배율 (영업이익/이자비용)
    df["interest_coverage"] = np.where(
        (df["interest_expense"] != 0) & df["interest_expense"].notna(),
        df["operating_income"] / df["interest_expense"],
        np.nan,
    )

    # 영업이익률 (영업이익/매출 × 100)
    df["operating_margin"] = np.where(
        df["revenue"] != 0,
        df["operating_income"] / df["revenue"] * 100,
        np.nan,
    )

    log.info("재무 비율 6종 계산 완료")
    return df


def compute_altman_zscore(df: pd.DataFrame) -> pd.DataFrame:
    """Altman Z-Score 계산 (제조업 기준)

    Z = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4 + 1.0*X5
    X1 = 운전자본/자산 = (유동자산-유동부채)/자산
    X2 = 이익잉여금/자산
    X3 = EBIT/자산 ≈ 영업이익/자산
    X4 = 자기자본/부채
    X5 = 매출/자산
    """
    df = df.copy()
    ta = df["total_assets"]

    x1 = np.where(ta != 0, (df["current_assets"] - df["current_liabilities"]) / ta, 0)
    x2 = np.where(
        (ta != 0) & df["retained_earnings"].notna(),
        df["retained_earnings"] / ta,
        0,
    )
    x3 = np.where(ta != 0, df["operating_income"] / ta, 0)
    x4 = np.where(
        df["total_liabilities"] != 0,
        df["total_equity"] / df["total_liabilities"],
        0,
    )
    x5 = np.where(ta != 0, df["revenue"] / ta, 0)

    df["altman_z"] = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 1.0 * x5

    # Z-Score 해석 구간
    df["altman_zone"] = pd.cut(
        df["altman_z"],
        bins=[-np.inf, 1.81, 2.99, np.inf],
        labels=["distress", "grey", "safe"],
    )

    log.info("Altman Z-Score 계산 완료")
    return df


def compute_weighted_score(df: pd.DataFrame) -> pd.DataFrame:
    """가중 합산 건전성 점수 (0~100점 환산)

    부채비율: 25% (낮을수록 좋음 → 역수)
    유동비율: 20% (높을수록 좋음)
    ROE: 15%
    ROA: 15%
    이자보상배율: 15%
    영업이익률: 10%
    """
    df = df.copy()

    def _percentile_score(series: pd.Series, ascending: bool = True) -> pd.Series:
        """시리즈를 0~100 백분위 점수로 변환"""
        if ascending:
            return series.rank(pct=True, na_option="bottom") * 100
        else:
            return (1 - series.rank(pct=True, na_option="top")) * 100

    scores = pd.DataFrame(index=df.index)
    scores["debt_score"] = _percentile_score(df["debt_ratio"], ascending=False)  # 낮을수록 좋음
    scores["current_score"] = _percentile_score(df["current_ratio"], ascending=True)
    scores["roe_score"] = _percentile_score(df["roe"], ascending=True)
    scores["roa_score"] = _percentile_score(df["roa"], ascending=True)
    scores["icr_score"] = _percentile_score(df["interest_coverage"], ascending=True)
    scores["opm_score"] = _percentile_score(df["operating_margin"], ascending=True)

    weights = {
        "debt_score": 0.25,
        "current_score": 0.20,
        "roe_score": 0.15,
        "roa_score": 0.15,
        "icr_score": 0.15,
        "opm_score": 0.10,
    }

    df["health_score"] = sum(scores[k] * w for k, w in weights.items())
    df["health_grade"] = pd.cut(
        df["health_score"],
        bins=[0, 30, 50, 70, 100],
        labels=["위험", "주의", "보통", "우량"],
    )

    log.info("건전성 점수 계산 완료")
    return df


def compute_log_assets(df: pd.DataFrame) -> pd.DataFrame:
    """자산총계 log 변환 (규모 편향 완화)"""
    df = df.copy()
    df["log_assets"] = np.log1p(df["total_assets"].clip(lower=0))
    return df


def engineer_features_phase1() -> pd.DataFrame:
    """Phase 1 Feature Engineering 파이프라인"""
    input_path = DATA_PROCESSED / "financial_statements.csv"
    if not input_path.exists():
        log.error(f"전처리 데이터 없음: {input_path}")
        return pd.DataFrame()

    df = pd.read_csv(input_path)
    log.info(f"입력 데이터: {df.shape}")

    df = compute_financial_ratios(df)
    df = compute_altman_zscore(df)
    df = compute_weighted_score(df)
    df = compute_log_assets(df)

    # 저장
    output_path = DATA_PROCESSED / "financial_ratios.csv"
    df.to_csv(output_path, index=False)
    log.info(f"Feature Engineering 완료 → {output_path}")

    # 건전성 점수만 별도 저장 (Phase 4 연계용)
    score_cols = ["corp_code", "corp_name", "bsns_year", "health_score", "health_grade", "altman_z", "altman_zone"]
    existing = [c for c in score_cols if c in df.columns]
    df[existing].to_csv(DATA_PROCESSED / "health_scores.csv", index=False)

    return df


if __name__ == "__main__":
    engineer_features_phase1()
