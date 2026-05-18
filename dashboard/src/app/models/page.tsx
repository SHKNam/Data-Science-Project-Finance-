import { Code2, Database, FileCode2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { NextSteps } from "@/components/next-steps";
import { CompareButton } from "@/components/compare-button";
import { loadJSON, type ModelsCatalog } from "@/lib/data";

export const metadata = { title: "모델 카탈로그 · DART Insights" };

export default async function ModelsPage() {
  const catalog = await loadJSON<ModelsCatalog>("models_catalog.json");
  const phases = Object.keys(catalog) as Array<keyof typeof catalog>;

  return (
    <>
      <PageHeader
        eyebrow="MODELS"
        title="모델 카탈로그"
        description={`4개 페이즈에 걸쳐 사용된 총 ${Object.values(catalog).reduce((s, p) => s + p.models.length, 0)}개 모델. 각 모델의 라이브러리·하이퍼파라미터·구현 위치를 한눈에.`}
      />

      <Tabs defaultValue="phase1">
        <TabsList>
          {phases.map((p) => (
            <TabsTrigger key={p} value={p}>
              {catalog[p].title.replace(/^Phase \d+ · /, "")}
            </TabsTrigger>
          ))}
        </TabsList>

        {phases.map((p) => {
          const ph = catalog[p];
          return (
            <TabsContent key={p} value={p}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{ph.title}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  태스크: {ph.task} · 검증: {ph.validation}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ph.models.map((m) => (
                  <Card key={m.id} className="overflow-hidden">
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold truncate">{m.id}</h3>
                            <Badge variant="outline" className="shrink-0">
                              <Database size={10} /> {m.library}
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                            <span className="text-[10px] uppercase text-[var(--text-dim)] mr-1">파라미터:</span>
                            {m.params}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-[var(--text-dim)] font-mono">
                            <FileCode2 size={11} /> {m.file}
                          </div>
                        </div>
                        <CompareButton id={m.id} label={m.id} type="model" size="sm" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <NextSteps
        steps={[
          { href: "/validation", title: "검증 방법론", description: "메트릭 정의와 재현 명령어", icon: Code2 },
          { href: "/compare", title: "모델 비교", description: "2~5개 사이드바이사이드", icon: Code2 },
          { href: "/glossary", title: "용어집", description: "통계·ML 용어", icon: Code2 },
        ]}
      />
    </>
  );
}
