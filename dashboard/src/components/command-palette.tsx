"use client";

import { Command } from "cmdk";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  Building2,
  Database,
  FileText,
  Home,
  Layers,
  LineChart,
  Network,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import type { FinancialRatio } from "@/lib/data";

type Entry = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  kind: "page" | "company" | "model" | "term";
  icon?: React.ComponentType<{ size?: number }>;
};

const PAGES: Entry[] = [
  { id: "p-home", label: "홈", href: "/", kind: "page", icon: Home },
  { id: "p-summary", label: "Executive Summary", href: "/summary", kind: "page", icon: Sparkles },
  { id: "p-p1", label: "Phase 1 · 재무건전성", href: "/phase-1", kind: "page", icon: Activity },
  { id: "p-p2", label: "Phase 2 · 업종 클러스터", href: "/phase-2", kind: "page", icon: Layers },
  { id: "p-p3", label: "Phase 3 · 이상탐지", href: "/phase-3", kind: "page", icon: AlertTriangle },
  { id: "p-p4", label: "Phase 4 · 공시 시계열", href: "/phase-4", kind: "page", icon: LineChart },
  { id: "p-cross", label: "Cross-phase 교차 분석", href: "/cross-phase", kind: "page", icon: Network },
  { id: "p-compare", label: "비교 모드", href: "/compare", kind: "page", icon: TrendingUp },
  { id: "p-watch", label: "워치리스트", href: "/watchlist", kind: "page", icon: Star },
  { id: "p-models", label: "모델 카탈로그", href: "/models", kind: "page", icon: Boxes },
  { id: "p-data", label: "데이터셋", href: "/data", kind: "page", icon: Database },
  { id: "p-valid", label: "검증 방법론", href: "/validation", kind: "page", icon: FileText },
  { id: "p-glossary", label: "용어집", href: "/glossary", kind: "page", icon: FileText },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<Entry[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !inField) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open || companies.length > 0) return;
    fetch("/data/financial_ratios.json")
      .then((r) => r.json())
      .then((rows: FinancialRatio[]) => {
        const seen = new Set<string>();
        const arr: Entry[] = [];
        for (const r of rows) {
          if (seen.has(r.corp_code)) continue;
          seen.add(r.corp_code);
          arr.push({
            id: `c-${r.corp_code}`,
            label: r.corp_name,
            hint: `${r.corp_code} · ${r.health_grade ?? "—"}`,
            href: `/company/${r.corp_code}`,
            kind: "company",
            icon: Building2,
          });
        }
        setCompanies(arr);
      })
      .catch(() => undefined);
  }, [open, companies.length]);

  const all = useMemo(() => [...PAGES, ...companies], [companies]);
  const fuse = useMemo(
    () =>
      new Fuse(all, {
        keys: ["label", "hint"],
        threshold: 0.35,
        includeScore: false,
      }),
    [all],
  );

  const results = useMemo(() => {
    if (!query.trim()) return all.slice(0, 30);
    return fuse.search(query).slice(0, 30).map((x) => x.item);
  }, [all, fuse, query]);

  const grouped = useMemo(() => {
    const g: Record<string, Entry[]> = {};
    for (const r of results) {
      g[r.kind] = g[r.kind] || [];
      g[r.kind].push(r);
    }
    return g;
  }, [results]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-24 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false} className="flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <Search size={16} className="text-[var(--text-muted)]" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="기업명·corp_code·페이지·모델 검색 (예: 강남제비스코, AdaBoost, Phase 2)"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--text-dim)]"
              autoFocus
            />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-dim)]">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto py-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              결과가 없습니다.
            </Command.Empty>
            {grouped.page && grouped.page.length > 0 && (
              <Command.Group
                heading="페이지"
                className="px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--text-dim)]"
              >
                {grouped.page.map((e) => (
                  <Item key={e.id} entry={e} onSelect={() => { router.push(e.href); setOpen(false); }} />
                ))}
              </Command.Group>
            )}
            {grouped.company && grouped.company.length > 0 && (
              <Command.Group
                heading={`기업 (${grouped.company.length})`}
                className="px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--text-dim)]"
              >
                {grouped.company.slice(0, 20).map((e) => (
                  <Item key={e.id} entry={e} onSelect={() => { router.push(e.href); setOpen(false); }} />
                ))}
              </Command.Group>
            )}
          </Command.List>
          <div className="border-t border-[var(--border)] px-3 py-2 text-[11px] text-[var(--text-dim)] flex justify-between">
            <span>↑↓ 이동 · ↵ 선택 · ESC 닫기</span>
            <span>{results.length}개 결과</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

function Item({ entry, onSelect }: { entry: Entry; onSelect: () => void }) {
  const Icon = entry.icon;
  return (
    <Command.Item
      value={`${entry.label} ${entry.hint ?? ""}`}
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/70 text-[var(--text)]"
    >
      {Icon && (
        <span className="w-5 h-5 flex items-center justify-center text-[var(--text-muted)]">
          <Icon size={14} />
        </span>
      )}
      <span className="flex-1 truncate">{entry.label}</span>
      {entry.hint && (
        <span className="text-[11px] text-[var(--text-dim)] font-mono">{entry.hint}</span>
      )}
    </Command.Item>
  );
}
