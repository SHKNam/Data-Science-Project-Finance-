import { Flame } from "lucide-react";

export function AttentionBadge({
  reason,
  level = "warning",
}: {
  reason: string;
  level?: "warning" | "danger" | "info";
}) {
  const styles = {
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    danger: "bg-red-500/15 text-red-300 border-red-500/30 animate-pulse",
    info: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  }[level];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] border ${styles}`}>
      <Flame size={11} />
      {reason}
    </div>
  );
}
