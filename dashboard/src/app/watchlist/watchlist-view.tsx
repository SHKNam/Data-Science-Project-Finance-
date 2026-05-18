"use client";

import Link from "next/link";
import { Download, Star, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useWatchlist } from "@/stores/watchlist";
import { useCompare } from "@/stores/compare";
import { gradeBg } from "@/lib/format";

type IndexEntry = { corp_name: string; health_grade: string; health_score: number; anomaly_votes: number };

export function WatchlistView({
  index,
  suggestions,
}: {
  index: Record<string, IndexEntry>;
  suggestions: Array<{
    corp_code: string;
    corp_name: string;
    health_grade: string;
    health_score: number;
  }>;
}) {
  const items = useWatchlist((s) => s.items);
  const remove = useWatchlist((s) => s.remove);
  const setNote = useWatchlist((s) => s.setNote);
  const toggleWatch = useWatchlist((s) => s.toggle);
  const addCompare = useCompare((s) => s.add);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <EmptyState
        title="아직 저장된 기업이 없습니다"
        description="기업 페이지에서 ⭐ 버튼을 누르면 여기에 저장됩니다. 추천 기업으로 시작해 보세요."
        action={
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
            {suggestions.map((s) => (
              <button
                key={s.corp_code}
                type="button"
                onClick={() => toggleWatch(s.corp_code, s.corp_name)}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-[var(--border)] hover:border-amber-500/40 hover:bg-amber-500/5 text-sm transition-colors text-left"
              >
                <span className="truncate">{s.corp_name}</span>
                <span className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${gradeBg(s.health_grade)}`}>
                    {s.health_grade}
                  </span>
                  <Star size={11} className="text-amber-300" />
                </span>
              </button>
            ))}
          </div>
        }
      />
    );
  }

  const exportCsv = () => {
    const header = "corp_code,corp_name,health_grade,health_score,anomaly_votes,note,added_at\n";
    const rows = items
      .map((it) => {
        const x = index[it.corp_code] ?? {};
        const note = (it.note ?? "").replace(/"/g, '""');
        return `"${it.corp_code}","${it.corp_name}","${x.health_grade ?? ""}",${x.health_score ?? ""},${x.anomaly_votes ?? ""},"${note}","${it.added_at}"`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watchlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addAllToCompare = () => {
    for (const it of items.slice(0, 5)) {
      addCompare({ id: it.corp_code, label: it.corp_name, type: "company" });
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <Badge variant="primary">{items.length}개 저장됨</Badge>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download size={12} /> CSV export
          </Button>
          <Button variant="primary" size="sm" onClick={addAllToCompare}>
            전체 비교에 추가 (최대 5개)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it) => {
          const x = index[it.corp_code];
          return (
            <Card key={it.corp_code} className="overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/company/${it.corp_code}`}
                      className="text-sm font-medium hover:text-[var(--primary)] truncate inline-block max-w-full"
                    >
                      {it.corp_name}
                    </Link>
                    <div className="text-[10px] text-[var(--text-dim)] font-mono mt-0.5">
                      {it.corp_code}
                    </div>
                    {x && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${gradeBg(x.health_grade)}`}>
                          {x.health_grade}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] tabular">
                          건전성 {x.health_score.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] tabular">
                          votes {x.anomaly_votes}/7
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(it.corp_code)}
                    className="text-[var(--text-dim)] hover:text-red-400 p-1"
                    aria-label="제거"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea
                  value={it.note ?? ""}
                  onChange={(e) => setNote(it.corp_code, e.target.value)}
                  placeholder="메모 추가..."
                  rows={2}
                  className="mt-3 w-full bg-[var(--background)]/40 border border-[var(--border)] rounded-md px-2 py-1.5 text-xs resize-none focus:outline-none focus:border-[var(--border-strong)] placeholder:text-[var(--text-dim)]"
                />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
