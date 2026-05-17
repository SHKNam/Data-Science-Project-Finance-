"""Global configuration for the DART Financial Data Science Project."""

import os
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED = PROJECT_ROOT / "data" / "processed"
MODELS_DIR = PROJECT_ROOT / "models"
LOGS_DIR = PROJECT_ROOT / "logs"

# Reproducibility
RANDOM_SEED = 42

# Data split
TEST_SIZE = 0.15
VAL_SIZE = 0.15

# DART API
DART_BASE_URL = "https://opendart.fss.or.kr/api"
API_SLEEP = 0.5
MAX_API_RETRIES = 3
API_DAILY_LIMIT = 20000
API_WARN_THRESHOLD = 18000
REPRT_CODES = {
    "annual": "11011",
    "semi": "11012",
    "q1": "11013",
    "q3": "11014",
}

# Device (lazy import to avoid torch dependency at config load time)
_device = None

def get_device():
    global _device
    if _device is None:
        try:
            import torch
            _device = "mps" if torch.backends.mps.is_available() else "cpu"
        except ImportError:
            _device = "cpu"
    return _device
