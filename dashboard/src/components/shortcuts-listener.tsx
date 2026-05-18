"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV: Record<string, string> = {
  "1": "/phase-1",
  "2": "/phase-2",
  "3": "/phase-3",
  "4": "/phase-4",
  s: "/summary",
  c: "/compare",
  w: "/watchlist",
  h: "/",
  m: "/models",
  d: "/data",
  v: "/validation",
};

export function ShortcutsListener() {
  const router = useRouter();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const pendingG = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (inField) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
        return;
      }
      if (e.key.toLowerCase() === "g") {
        pendingG.current = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          pendingG.current = false;
        }, 800);
        return;
      }
      if (pendingG.current) {
        const next = NAV[e.key.toLowerCase()];
        if (next) {
          e.preventDefault();
          router.push(next);
        }
        pendingG.current = false;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!showShortcuts) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={() => setShowShortcuts(false)}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">키보드 단축키</h2>
        <div className="space-y-2 text-sm">
          {[
            ["⌘/Ctrl + K", "검색 / 명령 팔레트"],
            ["/", "검색 열기"],
            ["g 1~4", "Phase 1~4로 이동"],
            ["g s", "Executive Summary"],
            ["g c", "비교 모드"],
            ["g w", "워치리스트"],
            ["g m", "모델 카탈로그"],
            ["g d", "데이터셋"],
            ["g v", "검증 방법론"],
            ["g h", "홈"],
            ["?", "이 도움말"],
            ["ESC", "닫기"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1.5">
              <span className="text-[var(--text-muted)]">{v}</span>
              <kbd className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                {k}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
