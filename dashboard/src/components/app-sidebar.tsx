"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  ChevronRight,
  Clock,
  Compass,
  Database,
  FileText,
  HelpCircle,
  Home,
  Layers,
  LineChart,
  Menu,
  Network,
  Presentation,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecent } from "@/stores/recent";

const SECTIONS: Array<{
  label: string;
  items: Array<{ href: string; label: string; icon: typeof Home; chip?: string }>;
}> = [
  {
    label: "탐색",
    items: [
      { href: "/", label: "홈", icon: Home },
      { href: "/summary", label: "Executive Summary", icon: Sparkles },
      { href: "/guides", label: "시나리오 가이드", icon: Compass },
    ],
  },
  {
    label: "페이즈 분석",
    items: [
      { href: "/phase-1", label: "재무건전성", icon: Activity, chip: "16" },
      { href: "/phase-2", label: "업종 클러스터", icon: Layers, chip: "9" },
      { href: "/phase-3", label: "이상탐지", icon: AlertTriangle, chip: "7" },
      { href: "/phase-4", label: "공시 시계열", icon: LineChart, chip: "5" },
      { href: "/cross-phase", label: "교차 분석", icon: Network },
    ],
  },
  {
    label: "도구",
    items: [
      { href: "/compare", label: "비교 모드", icon: TrendingUp },
      { href: "/watchlist", label: "워치리스트", icon: Star },
      { href: "/present", label: "발표 모드", icon: Presentation },
    ],
  },
  {
    label: "참고",
    items: [
      { href: "/models", label: "모델 카탈로그", icon: Boxes, chip: "37" },
      { href: "/data", label: "데이터셋", icon: Database },
      { href: "/validation", label: "검증 방법론", icon: BarChart3 },
      { href: "/glossary", label: "용어집", icon: FileText },
      { href: "/help", label: "도움말", icon: HelpCircle },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const recent = useRecent((s) => s.items);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="메뉴 열기"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-[var(--surface)] border border-[var(--border)] no-print"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden no-print"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-64 z-50 lg:z-30",
          "bg-[var(--surface)]/95 backdrop-blur-xl border-r border-[var(--border)]",
          "flex flex-col transition-transform no-print",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-5 py-5 border-b border-[var(--border)] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
              <span className="text-[var(--background)] font-bold text-sm">D</span>
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">DART Insights</div>
              <div className="text-[10px] text-[var(--text-dim)] tracking-wider">
                금융 데이터 분석
              </div>
            </div>
          </Link>
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 text-[var(--text-muted)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-3 pt-3" data-onboarding="search-trigger">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-command-palette"));
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md",
              "text-xs text-[var(--text-muted)]",
              "bg-[var(--background)]/40 hover:bg-[var(--surface-2)]",
              "border border-[var(--border)] transition-colors",
            )}
          >
            <Search size={14} />
            <span className="flex-1 text-left">기업·모델·페이지 검색</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-2 py-3"
          data-onboarding="sidebar-nav"
        >
          {SECTIONS.map((sec) => (
            <div key={sec.label} className="mb-4">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-semibold">
                {sec.label}
              </div>
              {sec.items.map((it) => {
                const Icon = it.icon;
                const active =
                  pathname === it.href ||
                  (it.href !== "/" && pathname.startsWith(it.href));
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm",
                      "transition-colors",
                      active
                        ? "bg-[var(--surface-2)] text-[var(--text)] shadow-sm"
                        : "text-[var(--text-muted)] hover:bg-[var(--surface-2)]/60 hover:text-[var(--text)]",
                    )}
                  >
                    <Icon
                      size={15}
                      className={cn(
                        "shrink-0",
                        active && "text-[var(--primary)]",
                      )}
                    />
                    <span className="flex-1">{it.label}</span>
                    {it.chip ? (
                      <span className="text-[10px] tabular px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-dim)] border border-[var(--border)]">
                        {it.chip}
                      </span>
                    ) : null}
                    {active && <ChevronRight size={12} className="text-[var(--primary)]" />}
                  </Link>
                );
              })}
            </div>
          ))}

          {recent.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-semibold flex items-center gap-1.5">
                <Clock size={10} /> 최근 본 항목
              </div>
              {recent.slice(0, 5).map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[var(--text-muted)] hover:bg-[var(--surface-2)]/60 hover:text-[var(--text)] transition-colors"
                >
                  <span className="truncate">{it.label}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="px-3 py-3 border-t border-[var(--border)] text-[10px] text-[var(--text-dim)]">
          <div>v1.0 · 2026-05-18</div>
          <div className="mt-0.5">DART OpenAPI · 한국 791사</div>
        </div>
      </aside>
    </>
  );
}
