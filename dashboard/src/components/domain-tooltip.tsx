"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TERMS } from "@/lib/domain";

export function DomainTooltip({
  term,
  children,
}: {
  term: keyof typeof TERMS;
  children?: React.ReactNode;
}) {
  const t = TERMS[term];
  if (!t) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help underline decoration-dotted decoration-[var(--text-dim)] underline-offset-2">
            {children ?? t.ko}
            <HelpCircle size={11} className="text-[var(--text-dim)]" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="font-semibold text-sm">{t.ko}{t.en ? ` · ${t.en}` : ""}</div>
          <div className="mt-1 text-[var(--text-muted)]">{t.short}</div>
          <div className="mt-2 text-[var(--text)]/80 leading-relaxed">{t.detail}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
