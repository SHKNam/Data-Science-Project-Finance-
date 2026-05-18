"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { fmtFloat, fmtNumber } from "@/lib/format";
import type {
  LeaderboardP1,
  LeaderboardP2,
  LeaderboardP4,
  Meta,
} from "@/lib/data";

export function PresentDeck({
  meta,
  bestP1,
  bestP2,
  bestP4,
  grades,
  suspCount,
  insights,
}: {
  meta: Meta;
  bestP1: LeaderboardP1 | undefined;
  bestP2: LeaderboardP2 | undefined;
  bestP4: LeaderboardP4 | undefined;
  grades: Array<{ g: string; n: number }>;
  suspCount: number;
  insights: string[];
}) {
  const [idx, setIdx] = useState(0);

  const slides = [
    {
      eyebrow: "DART 금융 데이터 사이언스",
      title: "한국 상장기업 791사의 재무·이상·시계열을 한 시야로",
      body: (
        <div className="space-y-2 text-2xl text-[var(--text-muted)]">
          <div>4 페이즈 · 37 모델 · 120,000건 공시</div>
          <div className="text-base text-[var(--text-dim)] mt-6">
            마지막 갱신: {meta.generated_at.substring(0, 10)}
          </div>
        </div>
      ),
    },
    {
      eyebrow: "데이터",
      title: "DART OpenAPI · 791개 상장기업",
      body: (
        <div className="grid grid-cols-2 gap-8 text-3xl">
          <Stat label="기업" value={fmtNumber(meta.n_companies)} />
          <Stat label="모델" value={fmtNumber(meta.n_models)} />
          <Stat label="공시" value={fmtNumber(meta.n_disclosures)} />
          <Stat label="페이즈" value="4" />
        </div>
      ),
    },
    {
      eyebrow: "PHASE 01",
      title: "재무건전성 분류",
      body: (
        <div className="space-y-4 text-2xl">
          <Stat label="최고 AUC" value={fmtFloat(bestP1?.auc_roc ?? 0, 3)} sub={bestP1?.model} />
          <Stat label="최고 F1" value={fmtFloat(bestP1?.f1 ?? 0, 3)} />
          <div className="text-base text-[var(--text-muted)] max-w-2xl">
            16개 모델 · 70/15/15 split · 위험 클래스 1.8% 극심한 불균형이 메인 제약
          </div>
        </div>
      ),
    },
    {
      eyebrow: "PHASE 02",
      title: "업종 클러스터링",
      body: (
        <div className="space-y-4 text-2xl">
          <Stat
            label="최적 모델"
            value={bestP2?.model ?? ""}
            sub={`Silhouette ${fmtFloat(bestP2?.silhouette ?? 0, 3)}`}
          />
          <Stat label="클러스터 K" value={String(bestP2?.n_clusters ?? 0)} />
          <div className="text-base text-[var(--text-muted)] max-w-2xl">
            9개 모델 · PCA 2D · 자동 의미 라벨링
          </div>
        </div>
      ),
    },
    {
      eyebrow: "PHASE 03",
      title: "이상탐지 + Benford's Law",
      body: (
        <div className="space-y-4 text-2xl">
          <Stat label="모델 합의 의심 (votes≥4)" value={fmtNumber(suspCount)} />
          <div className="text-base text-[var(--text-muted)] max-w-2xl">
            7개 모델 앙상블 · IsolationForest/LOF/OneClassSVM/EllipticEnvelope/DBSCAN/Autoencoder + 다수결 +
            Benford&apos;s Law 자릿수 검정
          </div>
        </div>
      ),
    },
    {
      eyebrow: "PHASE 04",
      title: "공시 시계열 예측",
      body: (
        <div className="space-y-4 text-2xl">
          <Stat label="최저 RMSE" value={fmtFloat(bestP4?.rmse ?? 0, 0)} sub={bestP4?.model} />
          <div className="text-base text-[var(--text-muted)] max-w-2xl">
            5개 모델 (ARIMA/Prophet/LSTM/GRU/Transformer) · 30/6 forward chaining
          </div>
        </div>
      ),
    },
    {
      eyebrow: "FINDINGS",
      title: "종합 발견",
      body: (
        <ul className="space-y-4 text-xl text-[var(--text-muted)] max-w-3xl">
          {insights.map((it, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-[var(--primary)] font-mono text-base mt-1">{i + 1}.</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ),
    },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") setIdx((i) => Math.min(slides.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  const s = slides[idx];

  return (
    <div className="fixed inset-0 z-[200] bg-[var(--background)] flex flex-col">
      <div className="absolute top-4 right-4 flex items-center gap-2 no-print">
        <span className="text-xs text-[var(--text-dim)] tabular">
          {idx + 1} / {slides.length}
        </span>
        <Link
          href="/summary"
          className="p-2 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
        >
          <X size={16} />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-8 lg:px-16 animate-fade-up" key={idx}>
        <div className="max-w-5xl w-full">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--primary)] font-semibold mb-4">
            {s.eyebrow}
          </div>
          <h1 className="text-5xl lg:text-6xl font-semibold tracking-tight leading-tight mb-10">
            {s.title}
          </h1>
          <div>{s.body}</div>
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-8 py-4 flex items-center justify-between no-print">
        <button
          type="button"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] disabled:opacity-30"
        >
          <ArrowLeft size={14} /> 이전
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === idx ? "bg-[var(--primary)] w-6" : "bg-[var(--border)]"
              }`}
              aria-label={`슬라이드 ${i + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIdx((i) => Math.min(slides.length - 1, i + 1))}
          disabled={idx === slides.length - 1}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] disabled:opacity-30"
        >
          다음 <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">{label}</div>
      <div className="mt-1 text-4xl font-semibold tabular text-[var(--primary)]">{value}</div>
      {sub && <div className="text-base text-[var(--text-muted)] mt-1">{sub}</div>}
    </div>
  );
}
