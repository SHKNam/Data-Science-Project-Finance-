"use client";

import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { useCompare } from "@/stores/compare";

export function CompareTray() {
  const items = useCompare((s) => s.items);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);

  if (items.length === 0) return null;
  const type = items[0].type;
  const href = `/compare?type=${type}&ids=${items.map((x) => x.id).join(",")}`;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 no-print">
      <div className="flex items-center gap-2 bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] rounded-full pl-4 pr-2 py-2 shadow-2xl">
        <span className="text-xs text-[var(--text-dim)] pr-1">
          비교: {items.length}/5 ({type === "company" ? "기업" : "모델"})
        </span>
        <div className="flex items-center gap-1">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => remove(it.id)}
              className="group flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--surface-2)] text-xs hover:bg-[var(--background)] transition-colors"
              title="제거"
            >
              <span className="truncate max-w-[80px]">{it.label}</span>
              <X size={11} className="text-[var(--text-dim)] group-hover:text-red-400" />
            </button>
          ))}
        </div>
        {items.length >= 2 && (
          <Link
            href={href}
            className="ml-2 flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90"
          >
            비교하기 <ArrowRight size={11} />
          </Link>
        )}
        <button
          type="button"
          onClick={clear}
          className="ml-1 p-1.5 text-[var(--text-dim)] hover:text-red-400"
          title="모두 비우기"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
