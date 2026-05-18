"use client";

import { Star } from "lucide-react";
import { useWatchlist } from "@/stores/watchlist";
import { cn } from "@/lib/utils";

export function WatchlistButton({
  corp_code,
  corp_name,
  size = "md",
}: {
  corp_code: string;
  corp_name: string;
  size?: "sm" | "md";
}) {
  const has = useWatchlist((s) => s.has(corp_code));
  const toggle = useWatchlist((s) => s.toggle);
  const dim = size === "sm" ? 12 : 14;
  return (
    <button
      type="button"
      onClick={() => toggle(corp_code, corp_name)}
      aria-label={has ? "워치리스트에서 제거" : "워치리스트에 추가"}
      title={has ? "워치리스트에서 제거" : "워치리스트에 추가"}
      className={cn(
        "inline-flex items-center gap-1 rounded-md transition-colors",
        size === "sm" ? "h-6 px-1.5 text-xs" : "h-8 px-2 text-sm",
        has
          ? "text-amber-300 bg-amber-500/10 border border-amber-500/30"
          : "text-[var(--text-muted)] hover:text-amber-300 hover:bg-[var(--surface-2)] border border-[var(--border)]",
      )}
    >
      <Star size={dim} fill={has ? "currentColor" : "none"} />
      {size !== "sm" && (has ? "저장됨" : "저장")}
    </button>
  );
}
