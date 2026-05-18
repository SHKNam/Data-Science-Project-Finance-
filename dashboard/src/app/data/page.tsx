import { Database, FileSpreadsheet, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { NextSteps } from "@/components/next-steps";
import { loadJSON, type DatasetCatalog, type Meta } from "@/lib/data";
import { fmtNumber, fmtPercent } from "@/lib/format";

export const metadata = { title: "데이터셋 · DART Insights" };

export default async function DataPage() {
  const [catalog, meta] = await Promise.all([
    loadJSON<DatasetCatalog>("datasets_catalog.json"),
    loadJSON<Meta>("meta.json"),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="DATA"
        title="데이터셋 카탈로그"
        description={`원본 → 전처리 → 분석 산출물까지 ${catalog.length}개 데이터셋. 각 파일의 행/열/결측률/샘플을 표시합니다.`}
      />

      <Card className="mb-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30">
        <div className="px-5 py-4 flex items-start gap-3">
          <Database className="text-blue-300 mt-0.5" size={18} />
          <div>
            <h3 className="text-sm font-semibold">데이터 출처</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              {meta.data_source} · 일일 한도 20,000건 · 마지막 수집:{" "}
              {meta.generated_at.substring(0, 10)} · 분석 대상: {fmtNumber(meta.n_companies)}사 (2023년 사업연도)
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {catalog.map((d) => (
          <Card key={d.name} className="overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={14} className="text-[var(--primary)]" />
                <h3 className="text-sm font-semibold font-mono">{d.name}</h3>
              </div>
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">{d.description}</p>
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{d.source}</Badge>
                <Badge variant="info" className="tabular">
                  {fmtNumber(d.rows)} rows
                </Badge>
                <Badge variant="default" className="tabular">
                  {d.n_columns} cols
                </Badge>
                <Badge
                  variant={d.missing_rate > 0.1 ? "warning" : "default"}
                  className="tabular"
                >
                  결측 {fmtPercent(d.missing_rate, 1)}
                </Badge>
              </div>
            </div>
            <div className="px-5 py-3">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-2">
                주요 컬럼
              </div>
              <div className="flex flex-wrap gap-1">
                {d.columns.slice(0, 12).map((c) => (
                  <span
                    key={c}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] font-mono"
                  >
                    {c}
                  </span>
                ))}
                {d.columns.length > 12 && (
                  <span className="text-[10px] text-[var(--text-dim)]">+{d.columns.length - 12}</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <NextSteps
        steps={[
          { href: "/validation", title: "검증 방법론", description: "각 페이즈의 검증 절차", icon: Layers },
          { href: "/glossary", title: "용어집", description: "재무·통계 용어", icon: Layers },
          { href: "/", title: "분석 시작", description: "Phase 1~4로 이동", icon: Layers },
        ]}
      />
    </>
  );
}
