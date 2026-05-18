"use client";

import { Check, Plus } from "lucide-react";
import { useCompare, type CompareType } from "@/stores/compare";
import { cn } from "@/lib/utils";

export function CompareButton({
  id,
  label,
  type,
  size = "md",
}: {
  id: string;
  label: string;
  type: CompareType;
  size?: "sm" | "md";
}) {
  const has = useCompare((s) => s.has(id));
  const add = useCompare((s) => s.add);
  const remove = useCompare((s) => s.remove);
  const dim = size === "sm" ? 11 : 14;
  return (
    <button
      type="button"
      onClick={() => (has ? remove(id) : add({ id, label, type }))}
      aria-label={has ? "비교에서 제거" : "비교에 추가"}
      className={cn(
        "inline-flex items-center gap-1 rounded-md transition-colors",
        size === "sm" ? "h-6 px-1.5 text-xs" : "h-8 px-2 text-sm",
        has
          ? "text-emerald-300 bg-emerald-500/10 border border-emerald-500/30"
          : "text-[var(--text-muted)] hover:text-emerald-300 hover:bg-[var(--surface-2)] border border-[var(--border)]",
      )}
    >
      {has ? <Check size={dim} /> : <Plus size={dim} />}
      {size !== "sm" && (has ? "비교 추가됨" : "비교")}
    </button>
  );
}
