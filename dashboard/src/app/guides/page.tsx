import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { NextSteps } from "@/components/next-steps";
import { GUIDES } from "@/lib/narrative";

export const metadata = { title: "시나리오 가이드 · DART Insights" };

export default function GuidesIndex() {
  return (
    <>
      <PageHeader
        eyebrow="GUIDES"
        title="시나리오 가이드"
        description={`각 페르소나·시나리오에 맞춘 ${GUIDES.length}개 워크플로우. 각 단계마다 실제 페이지로 가는 deep link가 포함되어 있어 가이드를 따라 그대로 작업할 수 있습니다.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="group">
            <Card
              className={`h-full transition-all hover:translate-y-[-2px] bg-gradient-to-br ${g.accent}`}
            >
              <div className="px-5 py-5 flex flex-col h-full">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{g.persona}</Badge>
                  <span className="text-[11px] text-[var(--text-dim)] inline-flex items-center gap-1">
                    <Clock size={11} /> {g.estimated_time}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{g.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed flex-1">
                  {g.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-xs text-[var(--primary)] group-hover:gap-2 transition-all">
                  {g.steps.length}단계 시작하기 <ArrowRight size={11} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <NextSteps
        steps={[
          { href: "/summary", title: "Executive Summary", description: "1페이지 요약으로 시작", icon: ArrowRight },
          { href: "/phase-1", title: "바로 Phase 1로", description: "16개 분류 모델 비교", icon: ArrowRight },
          { href: "/glossary", title: "용어집", description: "재무·통계·ML 용어", icon: ArrowRight },
        ]}
      />
    </>
  );
}
