import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  accent = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "primary" | "warning" | "danger" | "info";
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const accentClass = {
    default: "text-[var(--text)]",
    primary: "text-emerald-300",
    warning: "text-amber-300",
    danger: "text-red-300",
    info: "text-blue-300",
  }[accent];

  const accentBg = {
    default: "from-zinc-500/10 to-transparent",
    primary: "from-emerald-500/15 to-transparent",
    warning: "from-amber-500/15 to-transparent",
    danger: "from-red-500/15 to-transparent",
    info: "from-blue-500/15 to-transparent",
  }[accent];

  return (
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          accentBg,
        )}
      />
      <div className="relative px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
            {label}
          </div>
          {Icon && (
            <Icon size={16} className={cn("opacity-70", accentClass)} />
          )}
        </div>
        <div className={cn("mt-2 text-2xl font-semibold tabular", accentClass)}>
          {value}
        </div>
        {hint && (
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">{hint}</div>
        )}
      </div>
    </Card>
  );
}
