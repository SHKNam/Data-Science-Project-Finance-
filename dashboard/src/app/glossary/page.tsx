import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { NextSteps } from "@/components/next-steps";
import { TERMS } from "@/lib/domain";

export const metadata = { title: "용어집 · DART Insights" };

export default function GlossaryPage() {
  const groups = Array.from(new Set(Object.values(TERMS).map((t) => t.category)));

  return (
    <>
      <PageHeader
        eyebrow="GLOSSARY"
        title="용어집"
        description={`재무·통계·머신러닝·데이터 용어를 한 곳에서. cmd+K에서도 검색 가능합니다.`}
      />

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--primary)] font-semibold mb-3">
              {g}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(TERMS)
                .filter(([, t]) => t.category === g)
                .map(([k, t]) => (
                  <Card key={k}>
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="text-sm font-semibold">{t.ko}</h3>
                          {t.en && (
                            <div className="text-[10px] text-[var(--text-dim)] font-mono">
                              {t.en}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">{t.category}</Badge>
                      </div>
                      <p className="text-xs text-[var(--primary)] font-medium">{t.short}</p>
                      <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                        {t.detail}
                      </p>
                    </div>
                  </Card>
                ))}
            </div>
          </section>
        ))}
      </div>

      <NextSteps
        steps={[
          { href: "/validation", title: "검증 방법론", description: "메트릭이 어떻게 적용되는지", icon: BookOpen },
          { href: "/data", title: "데이터셋", description: "원본 데이터 출처와 구조", icon: BookOpen },
          { href: "/", title: "홈으로", description: "분석 시작", icon: BookOpen },
        ]}
      />
    </>
  );
}
