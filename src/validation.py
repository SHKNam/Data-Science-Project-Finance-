"""데이터 검증 모듈"""

import logging

import numpy as np
import pandas as pd

from config import LOGS_DIR

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOGS_DIR / "validation.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


def validate_schema(df: pd.DataFrame, required_cols: list[str], name: str = "") -> bool:
    """필수 컬럼 존재 여부 체크"""
    missing = set(required_cols) - set(df.columns)
    if missing:
        log.error(f"[{name}] 필수 컬럼 누락: {missing}")
        return False
    log.info(f"[{name}] 스키마 검증 통과 ({len(required_cols)}개 컬럼)")
    return True


def validate_numeric_range(df: pd.DataFrame, name: str = "") -> pd.DataFrame:
    """비즈니스 로직 기반 이상값 플래그"""
    flags = []

    if "total_assets" in df.columns:
        neg_assets = df["total_assets"] < 0
        if neg_assets.any():
            count = neg_assets.sum()
            log.warning(f"[{name}] 음수 자산총계: {count}건")
            flags.append(("negative_assets", neg_assets))

    if "total_equity" in df.columns:
        neg_equity = df["total_equity"] < 0
        if neg_equity.any():
            count = neg_equity.sum()
            log.warning(f"[{name}] 음수 자본총계 (자본잠식): {count}건")
            flags.append(("negative_equity", neg_equity))

    if "revenue" in df.columns:
        zero_rev = df["revenue"] == 0
        if zero_rev.any():
            count = zero_rev.sum()
            log.warning(f"[{name}] 매출 0원: {count}건")
            flags.append(("zero_revenue", zero_rev))

    return flags


def validate_duplicates(df: pd.DataFrame, key_cols: list[str], name: str = "") -> bool:
    """중복 키 체크"""
    existing = [c for c in key_cols if c in df.columns]
    if not existing:
        return True

    dupes = df.duplicated(subset=existing, keep=False)
    if dupes.any():
        count = dupes.sum()
        log.warning(f"[{name}] 중복 발견: {count}건 (키: {existing})")
        return False

    log.info(f"[{name}] 중복 없음")
    return True


def validate_year_continuity(df: pd.DataFrame, year_col: str = "bsns_year",
                              corp_col: str = "corp_code") -> pd.DataFrame:
    """연도별 데이터 연속성 체크 (Phase 3용)"""
    gaps = []
    for corp, group in df.groupby(corp_col):
        years = sorted(group[year_col].astype(int).unique())
        for i in range(len(years) - 1):
            if years[i + 1] - years[i] > 1:
                gaps.append({
                    "corp_code": corp,
                    "gap_from": years[i],
                    "gap_to": years[i + 1],
                })

    if gaps:
        gap_df = pd.DataFrame(gaps)
        log.warning(f"연도 갭 발견: {len(gaps)}건")
        return gap_df

    log.info("연도 연속성 검증 통과")
    return pd.DataFrame()


def run_full_validation(df: pd.DataFrame, name: str = "dataset") -> dict:
    """전체 검증 파이프라인 실행"""
    results = {"name": name, "shape": df.shape, "issues": []}

    # 기본 통계
    log.info(f"[{name}] Shape: {df.shape}")
    log.info(f"[{name}] 결측률:\n{df.isnull().mean().to_string()}")

    # 중복 체크
    if not validate_duplicates(df, ["corp_code", "bsns_year"], name):
        results["issues"].append("duplicates")

    # 범위 체크
    flags = validate_numeric_range(df, name)
    for flag_name, _ in flags:
        results["issues"].append(flag_name)

    if not results["issues"]:
        log.info(f"[{name}] 전체 검증 통과")
    else:
        log.warning(f"[{name}] 이슈 발견: {results['issues']}")

    return results
