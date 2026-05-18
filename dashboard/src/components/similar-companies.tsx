import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gradeBg } from "@/lib/format";
import { Users } from "lucide-react";

export function SimilarCompanies({
  items,
}: {
  items: Array<{
    corp_code: string;
    corp_name: string;
    distance: number;
    health_grade: string;
    health_score: number;
  }>;
}) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
        <Users size={14} className="text-[var(--primary)]" />
        <h3 className="text-sm font-semibold">PCA 거리 기준 유사 기업</h3>
        <Badge variant="outline" className="ml-auto">Top 5</Badge>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {items.map((it) => (
          <Link
            key={it.corp_code}
            href={`/company/${it.corp_code}`}
            className="block px-5 py-3 hover:bg-[var(--surface-2)]/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{it.corp_name}</div>
                <div className="text-[10px] text-[var(--text-dim)] font-mono">
                  {it.corp_code} · 거리 {it.distance.toFixed(3)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs tabular text-[var(--text-muted)]">
                  {it.health_score.toFixed(0)}
                </span>
                <span className={`px-2 py-0.5 text-[10px] rounded-full border ${gradeBg(it.health_grade)}`}>
                  {it.health_grade}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
