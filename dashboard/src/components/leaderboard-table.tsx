"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ArrowUpDown, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormatKind = "int" | "float2" | "float3" | "pct" | "time" | "raw";

export type Column<T> = {
  key: keyof T & string;
  label: string;
  format?: FormatKind;
  digits?: number;
  align?: "left" | "right";
  width?: string;
};

function formatVal(v: unknown, kind?: FormatKind, digits?: number): string {
  if (v == null || (typeof v === "number" && Number.isNaN(v))) return "—";
  if (kind === "int" && typeof v === "number") {
    return v.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  }
  if ((kind === "float2" || kind === "float3") && typeof v === "number") {
    const d = digits ?? (kind === "float2" ? 2 : 3);
    return v.toLocaleString("ko-KR", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  }
  if (kind === "pct" && typeof v === "number") {
    return `${(v * 100).toFixed(digits ?? 1)}%`;
  }
  if (kind === "time" && typeof v === "number") {
    return `${v.toFixed(digits ?? 2)}s`;
  }
  return String(v);
}

export function LeaderboardTable<T extends Record<string, unknown>>({
  data,
  columns,
  defaultSort,
  ascending = false,
  highlightTop = true,
}: {
  data: T[];
  columns: Column<T>[];
  defaultSort?: keyof T & string;
  ascending?: boolean;
  highlightTop?: boolean;
}) {
  const [sortKey, setSortKey] = useState<(keyof T & string) | null>(defaultSort ?? null);
  const [asc, setAsc] = useState(ascending);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return asc ? av - bv : bv - av;
      }
      return asc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [data, sortKey, asc]);

  const toggleSort = (k: keyof T & string) => {
    if (sortKey === k) setAsc((p) => !p);
    else {
      setSortKey(k);
      setAsc(false);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)]/60">
          <tr>
            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-semibold w-10">
              #
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-semibold cursor-pointer hover:text-[var(--text)]",
                  c.align === "right" ? "text-right" : "text-left",
                )}
                style={c.width ? { width: c.width } : undefined}
                onClick={() => toggleSort(c.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {c.label}
                  {sortKey === c.key ? (
                    asc ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                  ) : (
                    <ArrowUpDown size={10} className="opacity-30" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-t border-[var(--border)] transition-colors hover:bg-[var(--surface-2)]/40",
                highlightTop && i === 0 && "bg-emerald-500/5",
              )}
            >
              <td className="px-3 py-2 text-[var(--text-dim)] tabular text-xs">
                {highlightTop && i === 0 ? (
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Crown size={11} /> 1
                  </span>
                ) : (
                  i + 1
                )}
              </td>
              {columns.map((c) => {
                const v = row[c.key];
                return (
                  <td
                    key={c.key}
                    className={cn(
                      "px-3 py-2 tabular",
                      c.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {formatVal(v, c.format, c.digits)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
