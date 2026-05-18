import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Variant = "default" | "outline" | "primary" | "warning" | "danger" | "info";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const variants: Record<Variant, string> = {
    default: "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]",
    outline: "bg-transparent text-[var(--text-muted)] border-[var(--border)]",
    primary: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    danger: "bg-red-500/10 text-red-300 border-red-500/30",
    info: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border tabular",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
