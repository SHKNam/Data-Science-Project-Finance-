import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export type NextStep = {
  href: string;
  title: string;
  description: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

export function NextSteps({ steps }: { steps: NextStep[] }) {
  return (
    <section className="mt-12 pt-8 border-t border-[var(--border)]">
      <h2 className="text-xs uppercase tracking-wider text-[var(--text-dim)] mb-4">
        다음으로 볼만한 것
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="group">
              <Card className="h-full transition-all hover:border-[var(--border-strong)] hover:translate-y-[-2px]">
                <div className="px-5 py-4 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    {Icon && (
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
                        <Icon size={15} />
                      </div>
                    )}
                    <ArrowUpRight
                      size={14}
                      className="text-[var(--text-dim)] group-hover:text-[var(--primary)] transition-colors"
                    />
                  </div>
                  <div className="mt-3 text-sm font-medium text-[var(--text)]">
                    {s.title}
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">
                    {s.description}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
