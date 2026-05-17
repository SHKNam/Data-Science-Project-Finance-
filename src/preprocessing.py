"""데이터 전처리 모듈 — Phase 1: Financial Health Scoring"""

import logging
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler

from config import DATA_PROCESSED, DATA_RAW, LOGS_DIR

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOGS_DIR / "preprocessing.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


def _to_numeric(series: pd.Series) -> pd.Series:
    """문자열 금액 → 숫자 변환 (쉼표 제거, 빈값 처리)"""
    return pd.to_numeric(
        series.astype(str).str.replace(",", "").str.strip(),
        errors="coerce",
    )


def extract_key_accounts(df_raw: pd.DataFrame) -> pd.DataFrame:
    """원본 재무제표에서 핵심 계정 항목만 추출하여 기업×연도 단위로 피벗.

    추출 항목: 자산총계, 부채총계, 자본총계, 유동자산, 유동부채,
              매출액, 영업이익, 당기순이익, 이자비용, 이익잉여금
    """
    key_accounts = {
        "자산총계": "total_assets",
        "부채총계": "total_liabilities",
        "자본총계": "total_equity",
        "유동자산": "current_assets",
        "유동부채": "current_liabilities",
        "매출액": "revenue",
        "영업이익": "operating_income",  # 영업이익(손실) 포함
        "당기순이익": "net_income",  # 당기순이익(손실) 포함
        "이자비용": "interest_expense",
        "이익잉여금": "retained_earnings",
    }

    # account_nm에서 핵심 항목만 필터
    filtered = df_raw[df_raw["account_nm"].isin(key_accounts.keys())].copy()

    # 당기금액 숫자 변환
    filtered["amount"] = _to_numeric(filtered["thstrm_amount"])
    filtered["account_eng"] = filtered["account_nm"].map(key_accounts)

    # 기업×연도 단위로 피벗
    pivoted = filtered.pivot_table(
        index=["corp_code", "corp_name", "bsns_year"],
        columns="account_eng",
        values="amount",
        aggfunc="first",
    ).reset_index()

    pivoted.columns.name = None
    log.info(f"핵심 계정 추출 완료: {pivoted.shape}")
    return pivoted


def handle_missing_values(df: pd.DataFrame, threshold: float = 0.5) -> pd.DataFrame:
    """결측치 처리: 결측률 50% 초과 기업 제거 + 나머지 중앙값 대체"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns

    # 기업별 결측률 계산
    missing_rate = df[numeric_cols].isnull().mean(axis=1)
    before = len(df)
    df = df[missing_rate <= threshold].copy()
    removed = before - len(df)
    if removed > 0:
        log.info(f"결측률 {threshold*100}% 초과 기업 {removed}개 제거")

    # 나머지 결측치 → 중앙값 대체
    for col in numeric_cols:
        if df[col].isnull().any():
            median_val = df[col].median()
            count = df[col].isnull().sum()
            df[col] = df[col].fillna(median_val)
            log.debug(f"{col}: {count}건 결측 → 중앙값({median_val:.0f}) 대체")

    log.info(f"결측치 처리 완료: {df.shape}")
    return df


def handle_outliers(df: pd.DataFrame, method: str = "winsorize", factor: float = 3.0) -> pd.DataFrame:
    """이상치 처리: Winsorization (IQR × factor 기준 clip)

    Phase 3(이상탐지)에서는 이 함수를 호출하지 않을 것.
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns

    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - factor * iqr
        upper = q3 + factor * iqr
        clipped = df[col].clip(lower, upper)
        n_clipped = (df[col] != clipped).sum()
        if n_clipped > 0:
            log.debug(f"{col}: {n_clipped}건 Winsorize ({lower:.0f} ~ {upper:.0f})")
        df[col] = clipped

    log.info("이상치 Winsorization 완료")
    return df


def scale_features(df: pd.DataFrame, columns: list[str], method: str = "standard") -> tuple[pd.DataFrame, object]:
    """스케일링: StandardScaler (기본) 또는 MinMaxScaler (딥러닝용)"""
    if method == "minmax":
        scaler = MinMaxScaler()
    else:
        scaler = StandardScaler()

    df[columns] = scaler.fit_transform(df[columns])
    log.info(f"스케일링 완료 ({method}): {len(columns)}개 컬럼")
    return df, scaler


def preprocess_phase1(skip_outlier: bool = False) -> pd.DataFrame:
    """Phase 1 전처리 파이프라인 실행"""
    DATA_PROCESSED.mkdir(parents=True, exist_ok=True)

    # 1. 원본 로드
    raw_path = DATA_RAW / "financial_statements_all.csv"
    if not raw_path.exists():
        log.error(f"원본 데이터 없음: {raw_path}")
        return pd.DataFrame()

    df_raw = pd.read_csv(raw_path, dtype=str)
    log.info(f"원본 데이터 로드: {df_raw.shape}")

    # 2. 핵심 계정 추출
    df = extract_key_accounts(df_raw)

    # 3. 결측치 처리
    df = handle_missing_values(df)

    # 4. 이상치 처리 (Phase 3에서는 skip)
    if not skip_outlier:
        df = handle_outliers(df)

    # 5. 저장
    output_path = DATA_PROCESSED / "financial_statements.csv"
    df.to_csv(output_path, index=False)
    log.info(f"전처리 완료 → {output_path}")

    return df


if __name__ == "__main__":
    preprocess_phase1()
