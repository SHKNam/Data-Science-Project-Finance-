import { Code, HelpCircle, Keyboard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { NextSteps } from "@/components/next-steps";

export const metadata = { title: "도움말 · DART Insights" };

const SHORTCUTS = [
  ["⌘/Ctrl + K", "검색 / 명령 팔레트"],
  ["/", "검색 열기"],
  ["g 1~4", "Phase 1~4로 이동"],
  ["g s", "Executive Summary"],
  ["g c", "비교 모드"],
  ["g w", "워치리스트"],
  ["g m", "모델 카탈로그"],
  ["g d", "데이터셋"],
  ["g v", "검증 방법론"],
  ["g h", "홈"],
  ["?", "단축키 모달"],
  ["ESC", "닫기"],
];

const FAQ = [
  {
    q: "데이터는 어디에서 가져오나요?",
    a: "DART OpenAPI(https://opendart.fss.or.kr)에서 2023년 사업연도 기준 791개 상장기업의 재무제표·공시·위험 라벨을 수집했습니다. 일일 한도 20,000건.",
  },
  {
    q: "Phase 1 F1 점수가 왜 이렇게 낮나요?",
    a: "전체 791사 중 실제 위험 기업이 14개(약 1.8%)에 불과한 극심한 클래스 불균형 때문입니다. AUC가 0.5~0.7대인 것은 무작위보다 낫지만 운영 수준은 아니라는 뜻입니다.",
  },
  {
    q: "왜 Phase 2 클러스터가 2개만 나오나요?",
    a: "KMeans가 Silhouette 0.95로 최적이지만 사실상 1개 극단치 기업이 단독 클러스터로 분리된 결과입니다. 더 의미 있는 그룹화는 HDBSCAN(8개 + noise 387)를 참고하세요.",
  },
  {
    q: "워치리스트는 어디에 저장되나요?",
    a: "브라우저 localStorage(`dart-watchlist`)에 저장됩니다. 브라우저 데이터 삭제 시 사라지며, 다른 브라우저/기기와 동기화되지 않습니다.",
  },
  {
    q: "데이터를 새로고침하려면?",
    a: "프로젝트 루트에서 사전 분석 스크립트 5개를 다시 실행한 뒤 export_data.py를 실행하면 dashboard/public/data/*.json이 갱신됩니다. 자세한 명령어는 검증 방법론 페이지 참고.",
  },
  {
    q: "이상치 votes는 정확한가요?",
    a: "비지도 학습이라 ground truth는 없습니다. 7개 모델 중 ≥4개가 동의(votes≥4)할수록 추가 조사 가치가 큽니다. Benford 분석과 교차하면 신뢰도가 더 올라갑니다.",
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="HELP"
        title="도움말"
        description="키보드 단축키, FAQ, 데이터 새로고침 절차."
      />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <Keyboard size={14} />
            <h3 className="text-sm font-semibold">키보드 단축키</h3>
          </div>
          <div className="px-5 py-4 space-y-2">
            {SHORTCUTS.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-[var(--text-muted)]">{v}</span>
                <kbd className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                  {k}
                </kbd>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <HelpCircle size={14} />
            <h3 className="text-sm font-semibold">자주 묻는 질문 (FAQ)</h3>
          </div>
          <div className="px-5 py-4 space-y-4">
            {FAQ.map((q, i) => (
              <details key={i} className="group">
                <summary className="text-sm font-medium cursor-pointer flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                  <span className="text-[var(--text-dim)] tabular text-xs">{(i + 1).toString().padStart(2, "0")}</span>
                  {q.q}
                </summary>
                <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed pl-7">
                  {q.a}
                </p>
              </details>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30">
          <div className="px-5 py-4 flex items-start gap-3">
            <Code className="text-blue-300 mt-0.5" size={18} />
            <div>
              <h3 className="text-sm font-semibold">빌드 정보</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Next.js 16 (Turbopack) · React 19.2 · Tailwind CSS v4 · Recharts ·
                shadcn-style UI · 다크 테마 강제
              </p>
            </div>
          </div>
        </Card>
      </section>

      <NextSteps
        steps={[
          { href: "/glossary", title: "용어집", description: "재무·통계·ML 용어", icon: HelpCircle },
          { href: "/validation", title: "검증 방법론", description: "재현 명령어", icon: HelpCircle },
          { href: "/guides", title: "시나리오 가이드", description: "역할별 워크플로우", icon: HelpCircle },
        ]}
      />
    </>
  );
}
