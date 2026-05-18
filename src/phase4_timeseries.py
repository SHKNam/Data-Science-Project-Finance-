"""Phase 4 — 시계열 모델: ARIMA / Prophet / LSTM / GRU / Transformer + 분해."""

from __future__ import annotations

import logging
import os
import sys
import time
import warnings
from pathlib import Path

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")
os.environ.setdefault("OMP_NUM_THREADS", "1")
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import DATA_PROCESSED, MODELS_DIR, LOGS_DIR, RANDOM_SEED  # noqa: E402

import torch  # noqa: E402
import torch.nn as nn  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOGS_DIR / "phase4_timeseries.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

TRAIN_END = 30  # 처음 30개월 학습, 마지막 6개월 테스트
WINDOW = 6


def metrics(actual: np.ndarray, pred: np.ndarray) -> dict:
    diff = actual - pred
    rmse = float(np.sqrt(np.mean(diff ** 2)))
    mae = float(np.mean(np.abs(diff)))
    safe = np.where(np.abs(actual) < 1e-6, 1e-6, actual)
    mape = float(np.mean(np.abs(diff / safe)) * 100)
    return {"rmse": rmse, "mae": mae, "mape": mape}


def fit_arima(series: pd.Series, horizon: int) -> np.ndarray:
    from statsmodels.tsa.arima.model import ARIMA

    model = ARIMA(series, order=(2, 1, 1))
    fit = model.fit()
    return np.asarray(fit.forecast(steps=horizon))


def fit_prophet(df: pd.DataFrame, horizon: int) -> np.ndarray:
    from prophet import Prophet

    pdf = df.rename(columns={"year_month": "ds", "count": "y"})[["ds", "y"]]
    m = Prophet(yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=False)
    m.fit(pdf)
    future = m.make_future_dataframe(periods=horizon, freq="MS")
    fc = m.predict(future).tail(horizon)["yhat"].to_numpy()
    return fc


def _seq_dataset(values: np.ndarray, window: int):
    X, y = [], []
    for i in range(len(values) - window):
        X.append(values[i : i + window])
        y.append(values[i + window])
    return np.asarray(X, dtype=np.float32), np.asarray(y, dtype=np.float32)


class LSTMModel(nn.Module):
    def __init__(self, hidden: int = 32):
        super().__init__()
        self.rnn = nn.LSTM(input_size=1, hidden_size=hidden, batch_first=True)
        self.fc = nn.Linear(hidden, 1)

    def forward(self, x):
        out, _ = self.rnn(x)
        return self.fc(out[:, -1]).squeeze(-1)


class GRUModel(nn.Module):
    def __init__(self, hidden: int = 32):
        super().__init__()
        self.rnn = nn.GRU(input_size=1, hidden_size=hidden, batch_first=True)
        self.fc = nn.Linear(hidden, 1)

    def forward(self, x):
        out, _ = self.rnn(x)
        return self.fc(out[:, -1]).squeeze(-1)


class TFModel(nn.Module):
    def __init__(self, d_model: int = 32, n_heads: int = 4, n_layers: int = 2):
        super().__init__()
        self.proj = nn.Linear(1, d_model)
        layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=n_heads, dim_feedforward=64, batch_first=True, dropout=0.1
        )
        self.encoder = nn.TransformerEncoder(layer, num_layers=n_layers)
        self.fc = nn.Linear(d_model, 1)

    def forward(self, x):
        x = self.proj(x)
        out = self.encoder(x)
        return self.fc(out[:, -1]).squeeze(-1)


def fit_torch(model: nn.Module, train_vals: np.ndarray, horizon: int, epochs: int = 300) -> np.ndarray:
    torch.manual_seed(RANDOM_SEED)
    mu, sd = train_vals.mean(), train_vals.std() + 1e-9
    norm = (train_vals - mu) / sd

    X, y = _seq_dataset(norm, WINDOW)
    Xt = torch.from_numpy(X).unsqueeze(-1)
    yt = torch.from_numpy(y)
    opt = torch.optim.Adam(model.parameters(), lr=5e-3)
    crit = nn.MSELoss()
    model.train()
    for _ in range(epochs):
        opt.zero_grad()
        pred = model(Xt)
        loss = crit(pred, yt)
        loss.backward()
        opt.step()

    # 재귀 예측
    model.eval()
    history = list(norm)
    forecasts: list[float] = []
    with torch.no_grad():
        for _ in range(horizon):
            seq = torch.tensor(history[-WINDOW:], dtype=torch.float32).view(1, WINDOW, 1)
            p = float(model(seq).item())
            forecasts.append(p)
            history.append(p)
    forecasts = np.asarray(forecasts) * sd + mu
    return forecasts


def main():
    np.random.seed(RANDOM_SEED)
    torch.manual_seed(RANDOM_SEED)

    df = pd.read_csv(DATA_PROCESSED / "disclosure_monthly.csv")
    df["year_month"] = pd.to_datetime(df["year_month"])
    df = df.sort_values("year_month").reset_index(drop=True)

    if len(df) < TRAIN_END + 6:
        log.error(f"데이터 부족: {len(df)} < {TRAIN_END + 6}")
        return

    train, test = df.iloc[:TRAIN_END], df.iloc[TRAIN_END : TRAIN_END + 6]
    actual = test["count"].to_numpy(dtype=float)

    forecasts: dict[str, np.ndarray] = {}
    leaderboard = []

    # ARIMA
    try:
        t0 = time.time()
        fc = fit_arima(train["count"].astype(float), horizon=6)
        forecasts["arima"] = fc
        m = metrics(actual, fc)
        m.update({"model": "ARIMA", "train_time_sec": round(time.time() - t0, 2)})
        leaderboard.append(m)
        log.info(f"ARIMA: RMSE={m['rmse']:.0f}, MAE={m['mae']:.0f}, MAPE={m['mape']:.2f}%")
    except Exception as e:
        log.exception(f"ARIMA 실패: {e}")
        forecasts["arima"] = np.full(6, np.nan)

    # Prophet
    try:
        t0 = time.time()
        fc = fit_prophet(train, horizon=6)
        forecasts["prophet"] = fc
        m = metrics(actual, fc)
        m.update({"model": "Prophet", "train_time_sec": round(time.time() - t0, 2)})
        leaderboard.append(m)
        log.info(f"Prophet: RMSE={m['rmse']:.0f}, MAE={m['mae']:.0f}, MAPE={m['mape']:.2f}%")
    except Exception as e:
        log.exception(f"Prophet 실패: {e}")
        forecasts["prophet"] = np.full(6, np.nan)

    # LSTM / GRU / Transformer
    for name, mdl in [("lstm", LSTMModel()), ("gru", GRUModel()), ("transformer", TFModel())]:
        try:
            t0 = time.time()
            fc = fit_torch(mdl, train["count"].to_numpy(dtype=np.float32), horizon=6)
            forecasts[name] = fc
            m = metrics(actual, fc)
            m.update({"model": name.upper(), "train_time_sec": round(time.time() - t0, 2)})
            leaderboard.append(m)
            log.info(f"{name.upper()}: RMSE={m['rmse']:.0f}, MAE={m['mae']:.0f}, MAPE={m['mape']:.2f}%")
        except Exception as e:
            log.exception(f"{name} 실패: {e}")
            forecasts[name] = np.full(6, np.nan)

    # 결과 저장
    fc_df = pd.DataFrame({"year_month": test["year_month"].dt.strftime("%Y-%m-%d"), "actual": actual})
    for k in ("arima", "prophet", "lstm", "gru", "transformer"):
        fc_df[k] = forecasts.get(k, np.full(6, np.nan))
    fc_df.to_csv(DATA_PROCESSED / "phase4_forecasts.csv", index=False)

    lb = pd.DataFrame(leaderboard).sort_values("rmse").reset_index(drop=True)
    lb.to_csv(MODELS_DIR / "phase4_leaderboard.csv", index=False)

    # --- 시계열 분해 ---
    try:
        from statsmodels.tsa.seasonal import seasonal_decompose

        s = df.set_index("year_month")["count"].astype(float)
        dec = seasonal_decompose(s, model="additive", period=12, extrapolate_trend="freq")
        dec_df = pd.DataFrame(
            {
                "year_month": s.index.strftime("%Y-%m-%d"),
                "observed": s.values,
                "trend": dec.trend.values,
                "seasonal": dec.seasonal.values,
                "residual": dec.resid.values,
            }
        )
        dec_df.to_csv(DATA_PROCESSED / "phase4_decomposition.csv", index=False)
        log.info("phase4_decomposition.csv 저장")
    except Exception as e:
        log.exception(f"분해 실패: {e}")

    log.info(f"Phase 4 완료 — leaderboard {len(leaderboard)} models")


if __name__ == "__main__":
    main()
