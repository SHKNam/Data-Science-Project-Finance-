"""Phase 1 분류 모델 — 16개 모델 전수 비교"""

import logging
from typing import Any

import numpy as np
import torch
import torch.nn as nn
from pytorch_tabnet.tab_model import TabNetClassifier
from sklearn.ensemble import (
    AdaBoostClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
    StackingClassifier,
    VotingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

from config import RANDOM_SEED, get_device, MODELS_DIR

log = logging.getLogger(__name__)


def get_sklearn_models() -> dict[str, Any]:
    """sklearn 기반 분류 모델 11종 반환"""
    return {
        "LogisticRegression": LogisticRegression(
            max_iter=1000, random_state=RANDOM_SEED, class_weight="balanced"
        ),
        "KNN": KNeighborsClassifier(n_neighbors=5),
        "DecisionTree": DecisionTreeClassifier(
            random_state=RANDOM_SEED, class_weight="balanced"
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=100, random_state=RANDOM_SEED, class_weight="balanced"
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=100, random_state=RANDOM_SEED
        ),
        "AdaBoost": AdaBoostClassifier(
            n_estimators=100, random_state=RANDOM_SEED,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=100, random_state=RANDOM_SEED,
            eval_metric="logloss",
            scale_pos_weight=10,
            nthread=1,  # macOS segfault 방지
            tree_method="hist",
        ),
        "LightGBM": LGBMClassifier(
            n_estimators=100, random_state=RANDOM_SEED,
            class_weight="balanced", verbose=-1,
            n_jobs=1,  # macOS segfault 방지
        ),
        "SVC_rbf": SVC(
            kernel="rbf", probability=True, random_state=RANDOM_SEED,
            class_weight="balanced",
        ),
        "GaussianNB": GaussianNB(),
        "MLP": MLPClassifier(
            hidden_layer_sizes=(64, 32), max_iter=500,
            random_state=RANDOM_SEED, early_stopping=True,
        ),
    }


# --- PyTorch 딥러닝 모델 ---

class DNN(nn.Module):
    """다층 퍼셉트론 (Dropout + BatchNorm)"""
    def __init__(self, input_dim: int, hidden_dims: list[int] = None):
        super().__init__()
        if hidden_dims is None:
            hidden_dims = [128, 64, 32]

        layers = []
        prev_dim = input_dim
        for h in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, h),
                nn.BatchNorm1d(h),
                nn.ReLU(),
                nn.Dropout(0.3),
            ])
            prev_dim = h
        layers.append(nn.Linear(prev_dim, 1))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)


class CNN1D(nn.Module):
    """1D-CNN for tabular feature patterns"""
    def __init__(self, input_dim: int):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(1, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv1d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.fc = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 1),
        )

    def forward(self, x):
        x = x.unsqueeze(1)  # (batch, 1, features)
        x = self.conv(x).squeeze(-1)
        return self.fc(x)


class PyTorchClassifierWrapper:
    """PyTorch 모델을 sklearn 인터페이스로 래핑"""

    def __init__(self, model_class, input_dim: int, epochs: int = 100,
                 lr: float = 1e-3, batch_size: int = 64):
        self.device = get_device()
        self.model = model_class(input_dim).to(self.device)
        self.epochs = epochs
        self.lr = lr
        self.batch_size = batch_size
        self.classes_ = np.array([0, 1])

    def fit(self, X, y):
        torch.manual_seed(RANDOM_SEED)
        X_t = torch.FloatTensor(np.array(X)).to(self.device)
        y_t = torch.FloatTensor(np.array(y)).to(self.device)

        # 불균형 대응: pos_weight
        n_pos = y_t.sum().item()
        n_neg = len(y_t) - n_pos
        pos_weight = torch.tensor([n_neg / max(n_pos, 1)]).to(self.device)

        criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        optimizer = torch.optim.Adam(self.model.parameters(), lr=self.lr)

        self.model.train()
        dataset = torch.utils.data.TensorDataset(X_t, y_t)
        loader = torch.utils.data.DataLoader(dataset, batch_size=self.batch_size, shuffle=True)

        for epoch in range(self.epochs):
            for xb, yb in loader:
                optimizer.zero_grad()
                out = self.model(xb).squeeze()
                loss = criterion(out, yb)
                loss.backward()
                optimizer.step()

        return self

    def predict(self, X):
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)

    def predict_proba(self, X):
        self.model.eval()
        X_t = torch.FloatTensor(np.array(X)).to(self.device)
        with torch.no_grad():
            logits = self.model(X_t).squeeze()
            probs = torch.sigmoid(logits).cpu().numpy()
        if probs.ndim == 0:
            probs = np.array([probs])
        return np.column_stack([1 - probs, probs])


class TabNetWrapper:
    """TabNet을 sklearn 인터페이스로 래핑"""

    def __init__(self, input_dim: int, epochs: int = 50):
        self.model = TabNetClassifier(
            seed=RANDOM_SEED,
            verbose=0,
            device_name="cpu",  # MPS 호환성 문제 방지
        )
        self.epochs = epochs
        self.classes_ = np.array([0, 1])

    def fit(self, X, y):
        X_arr = np.array(X, dtype=np.float32)
        y_arr = np.array(y, dtype=np.int64)
        self.model.fit(
            X_arr, y_arr,
            max_epochs=self.epochs,
            patience=10,
            batch_size=256,
        )
        return self

    def predict(self, X):
        return self.model.predict(np.array(X, dtype=np.float32))

    def predict_proba(self, X):
        return self.model.predict_proba(np.array(X, dtype=np.float32))


def get_all_models(input_dim: int) -> dict[str, Any]:
    """전체 16개 모델 반환 (sklearn 11 + DL 3 + 앙상블 2는 나중에 추가)"""
    models = get_sklearn_models()

    # 딥러닝 모델
    models["DNN"] = PyTorchClassifierWrapper(DNN, input_dim, epochs=100)
    models["TabNet"] = TabNetWrapper(input_dim, epochs=50)
    models["CNN1D"] = PyTorchClassifierWrapper(CNN1D, input_dim, epochs=100)

    return models


def build_ensemble(top_models: list[tuple[str, Any]], method: str = "voting") -> Any:
    """상위 N개 모델로 앙상블 구성"""
    estimators = [(name, model) for name, model in top_models]

    if method == "stacking":
        return StackingClassifier(
            estimators=estimators,
            final_estimator=LogisticRegression(max_iter=1000),
            cv=5,
        )
    else:
        return VotingClassifier(
            estimators=estimators,
            voting="soft",
        )
