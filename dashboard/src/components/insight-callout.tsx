import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function InsightCallout({
  children,
  variant = "default",
  title = "주요 발견",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "warning" | "info";
  title?: string;
  className?: string;
}) {
  const styles = {
    default:
      "from-emerald-500/10 to-emerald-500/0 border-emerald-500/30 text-emerald-200",
    warning:
      "from-amber-500/10 to-amber-500/0 border-amber-500/30 text-amber-200",
    info: "from-blue-500/10 to-blue-500/0 border-blue-500/30 text-blue-200",
  }[variant];

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-gradient-to-br px-5 py-4 backdrop-blur-sm",
        styles,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
            {title}
          </div>
          <div className="mt-1 text-sm leading-relaxed text-[var(--text)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
