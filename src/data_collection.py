"""DART API 데이터 수집 모듈 — Phase 1: Financial Health Scoring"""

import io
import logging
import os
import time
import zipfile
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv
from lxml import etree
from tqdm import tqdm

from config import (
    API_DAILY_LIMIT,
    API_SLEEP,
    API_WARN_THRESHOLD,
    DART_BASE_URL,
    DATA_RAW,
    LOGS_DIR,
    MAX_API_RETRIES,
    PROJECT_ROOT,
    REPRT_CODES,
)

load_dotenv(PROJECT_ROOT / ".env")
API_KEY = os.getenv("DART_API_KEY")

# 로깅 설정
LOGS_DIR.mkdir(exist_ok=True)
DATA_RAW.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOGS_DIR / "data_collection.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# 일일 호출 카운터
_call_count = 0


def _api_call(endpoint: str, params: dict) -> dict | None:
    """DART API 호출 (rate limiting + retry + 상태 코드 검증)"""
    global _call_count

    if _call_count >= API_WARN_THRESHOLD:
        log.warning(f"일일 호출 {_call_count}건 도달. 한도({API_DAILY_LIMIT}) 주의.")
    if _call_count >= API_DAILY_LIMIT:
        log.error("일일 API 호출 한도 초과. 중단.")
        return None

    url = f"{DART_BASE_URL}/{endpoint}.json"
    params["crtfc_key"] = API_KEY

    for attempt in range(1, MAX_API_RETRIES + 1):
        try:
            time.sleep(API_SLEEP)
            resp = requests.get(url, params=params, timeout=30)
            _call_count += 1
            data = resp.json()

            status = data.get("status", "")
            if status == "000":
                return data
            elif status == "013":
                log.debug(f"데이터 없음: {endpoint} {params}")
                return None
            elif status == "011":
                log.error("API 사용량 초과")
                return None
            else:
                msg = data.get("message", "unknown")
                log.warning(f"API 오류 (status={status}): {msg} — 시도 {attempt}/{MAX_API_RETRIES}")

        except Exception as e:
            log.warning(f"요청 실패: {e} — 시도 {attempt}/{MAX_API_RETRIES}")

        backoff = 2 ** attempt
        time.sleep(backoff)

    log.error(f"최대 재시도 초과: {endpoint} {params}")
    return None


def fetch_corp_codes() -> pd.DataFrame:
    """corpCode.xml에서 전체 기업 고유번호 리스트를 다운로드하고 상장사만 필터."""
    cache_path = DATA_RAW / "corp_codes.csv"
    if cache_path.exists():
        log.info("캐시된 corp_codes.csv 사용")
        return pd.read_csv(cache_path, dtype=str)

    log.info("corpCode.xml 다운로드 중...")
    url = f"{DART_BASE_URL}/corpCode.xml"
    resp = requests.get(url, params={"crtfc_key": API_KEY}, timeout=60)

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        xml_bytes = zf.read(zf.namelist()[0])

    root = etree.fromstring(xml_bytes)
    rows = []
    for item in root.findall(".//list"):
        corp_code = item.findtext("corp_code", "")
        corp_name = item.findtext("corp_name", "")
        stock_code = item.findtext("stock_code", "")
        modify_date = item.findtext("modify_date", "")
        rows.append({
            "corp_code": corp_code,
            "corp_name": corp_name,
            "stock_code": stock_code,
            "modify_date": modify_date,
        })

    df = pd.DataFrame(rows)
    # 상장사만 필터 (stock_code가 비어있지 않은 것)
    df = df[df["stock_code"].str.strip().astype(bool)].reset_index(drop=True)
    log.info(f"상장사 {len(df)}개 확보")

    df.to_csv(cache_path, index=False)
    return df


def fetch_financial_statements(corp_code: str, bsns_year: str, reprt_code: str = "11011") -> pd.DataFrame | None:
    """단일회사 전체 재무제표 조회 (fnlttSinglAcntAll)"""
    data = _api_call("fnlttSinglAcntAll", {
        "corp_code": corp_code,
        "bsns_year": bsns_year,
        "reprt_code": reprt_code,
        "fs_div": "CFS",  # 연결재무제표 우선
    })
    if data and "list" in data:
        return pd.DataFrame(data["list"])

    # 연결재무제표 없으면 개별재무제표
    data = _api_call("fnlttSinglAcntAll", {
        "corp_code": corp_code,
        "bsns_year": bsns_year,
        "reprt_code": reprt_code,
        "fs_div": "OFS",
    })
    if data and "list" in data:
        return pd.DataFrame(data["list"])
    return None


def fetch_financial_index(corp_code: str, bsns_year: str, reprt_code: str = "11011") -> pd.DataFrame | None:
    """단일회사 주요 재무지표 조회 (fnlttSinglIndx)"""
    data = _api_call("fnlttSinglIndx", {
        "corp_code": corp_code,
        "bsns_year": bsns_year,
        "reprt_code": reprt_code,
        "idx_cl_code": "M210000",  # 수익성지표
    })
    if data and "list" in data:
        return pd.DataFrame(data["list"])
    return None


def fetch_risk_labels(corp_code: str, bsns_year: str) -> dict:
    """DS005: 부도/영업정지/회생 여부 조회 → 신용 위험 라벨링

    DS005 엔드포인트는 bgn_de/end_de (날짜 범위)를 사용한다.
    """
    labels = {"bankruptcy": 0, "suspension": 0, "rehabilitation": 0}
    bgn_de = f"{bsns_year}0101"
    end_de = f"{bsns_year}1231"
    base_params = {"corp_code": corp_code, "bgn_de": bgn_de, "end_de": end_de}

    # 부도발생
    data = _api_call("dfOcr", base_params.copy())
    if data and "list" in data:
        labels["bankruptcy"] = 1

    # 영업정지
    data = _api_call("bsnSp", base_params.copy())
    if data and "list" in data:
        labels["suspension"] = 1

    # 회생절차
    data = _api_call("ctrcvsBgrq", base_params.copy())
    if data and "list" in data:
        labels["rehabilitation"] = 1

    return labels


def fetch_kospi_corps(corps: pd.DataFrame) -> pd.DataFrame:
    """company API로 KOSPI(유가증권) 상장사만 필터.

    corp_cls: Y=유가증권(KOSPI), K=코스닥, N=코넥스, E=기타
    """
    cache_path = DATA_RAW / "kospi_corps.csv"
    if cache_path.exists():
        log.info("캐시된 kospi_corps.csv 사용")
        return pd.read_csv(cache_path, dtype=str)

    log.info("KOSPI 기업 필터링 중...")
    kospi_rows = []
    for _, row in tqdm(corps.iterrows(), total=len(corps), desc="시장구분 조회"):
        data = _api_call("company", {"corp_code": row["corp_code"]})
        if data and data.get("corp_cls") == "Y":
            kospi_rows.append({
                "corp_code": row["corp_code"],
                "corp_name": row["corp_name"],
                "stock_code": row["stock_code"],
                "induty_code": data.get("induty_code", ""),
            })

    df = pd.DataFrame(kospi_rows)
    df.to_csv(cache_path, index=False)
    log.info(f"KOSPI 상장사: {len(df)}개")
    return df


def collect_phase1_data(years: list[str] = None, max_corps: int = None,
                         market: str = "KOSPI"):
    """Phase 1 전체 데이터 수집 파이프라인

    Args:
        market: "KOSPI" (유가증권만), "ALL" (전체 상장사)
    """
    if years is None:
        years = ["2023", "2024"]

    # 1. 기업 리스트
    corps = fetch_corp_codes()
    if market == "KOSPI":
        corps = fetch_kospi_corps(corps)
    if max_corps:
        corps = corps.head(max_corps)

    corps.to_csv(DATA_RAW / "corp_list.csv", index=False)
    log.info(f"대상 기업: {len(corps)}개, 연도: {years}")

    # 2. 재무제표 수집
    all_statements = []
    all_labels = []
    resume_path = DATA_RAW / "last_success.txt"

    for year in years:
        cache_file = DATA_RAW / f"financial_statements_{year}.csv"
        label_file = DATA_RAW / f"risk_labels_{year}.csv"

        if cache_file.exists() and label_file.exists():
            log.info(f"{year}년 데이터 캐시 사용")
            all_statements.append(pd.read_csv(cache_file))
            all_labels.append(pd.read_csv(label_file))
            continue

        year_statements = []
        year_labels = []

        for _, row in tqdm(corps.iterrows(), total=len(corps), desc=f"{year}년 수집"):
            corp_code = row["corp_code"]

            # 재무제표
            fs = fetch_financial_statements(corp_code, year)
            if fs is not None:
                fs["corp_code"] = corp_code
                fs["corp_name"] = row["corp_name"]
                fs["bsns_year"] = year
                year_statements.append(fs)

            # 위험 라벨
            risk = fetch_risk_labels(corp_code, year)
            risk["corp_code"] = corp_code
            risk["corp_name"] = row["corp_name"]
            risk["bsns_year"] = year
            year_labels.append(risk)

            # 재개 포인트 저장
            resume_path.write_text(f"{corp_code},{year}")

        if year_statements:
            df_stmt = pd.concat(year_statements, ignore_index=True)
            df_stmt.to_csv(cache_file, index=False)
            all_statements.append(df_stmt)
            log.info(f"{year}년 재무제표: {len(df_stmt)}건")

        df_label = pd.DataFrame(year_labels)
        df_label.to_csv(label_file, index=False)
        all_labels.append(df_label)

    # 3. 전체 병합 저장
    if all_statements:
        combined_stmt = pd.concat(all_statements, ignore_index=True)
        combined_stmt.to_csv(DATA_RAW / "financial_statements_all.csv", index=False)
        log.info(f"전체 재무제표: {combined_stmt.shape}")

    if all_labels:
        combined_labels = pd.concat(all_labels, ignore_index=True)
        combined_labels.to_csv(DATA_RAW / "risk_labels_all.csv", index=False)
        risk_count = combined_labels[["bankruptcy", "suspension", "rehabilitation"]].sum()
        log.info(f"위험 라벨 합계:\n{risk_count}")

    log.info(f"Phase 1 데이터 수집 완료. 총 API 호출: {_call_count}건")


if __name__ == "__main__":
    collect_phase1_data()
