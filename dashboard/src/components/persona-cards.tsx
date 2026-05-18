import Link from "next/link";
import {
  AlertOctagon,
  Briefcase,
  Building2,
  GraduationCap,
  Layers3,
  Telescope,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const PERSONAS = [
  {
    title: "Risk Officer",
    desc: "위험 기업과 의심스러운 패턴을 단계별로 발굴",
    href: "/guides/find-risky-companies",
    icon: AlertOctagon,
    accent: "from-red-500/15 to-transparent border-red-500/30",
    chip: "리스크 분석가",
  },
  {
    title: "Investor",
    desc: "관심 기업을 검색해 동종업종과 비교·평가",
    href: "/guides/evaluate-a-company",
    icon: Briefcase,
    accent: "from-blue-500/15 to-transparent border-blue-500/30",
    chip: "투자자",
  },
  {
    title: "Data Scientist",
    desc: "37개 모델의 메트릭·SHAP·재현 명령어",
    href: "/guides/compare-models",
    icon: Layers3,
    accent: "from-emerald-500/15 to-transparent border-emerald-500/30",
    chip: "데이터 사이언티스트",
  },
  {
    title: "Researcher",
    desc: "데이터 출처·검증·인용 정보",
    href: "/guides/methodology",
    icon: GraduationCap,
    accent: "from-purple-500/15 to-transparent border-purple-500/30",
    chip: "연구자",
  },
  {
    title: "Executive",
    desc: "1분 요약 → 핵심 KPI와 발견 3가지",
    href: "/guides/executive-tour",
    icon: Telescope,
    accent: "from-amber-500/15 to-transparent border-amber-500/30",
    chip: "경영진",
  },
];

export function PersonaCards() {
  return (
    <section data-onboarding="persona-cards">
      <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--primary)] font-semibold mb-4">
        역할별 빠른 시작
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          return (
            <Link key={p.title} href={p.href} className="group">
              <Card
                className={`relative overflow-hidden h-full transition-all hover:translate-y-[-2px] bg-gradient-to-br ${p.accent}`}
              >
                <div className="px-5 py-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)] flex-shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                          {p.chip}
                        </div>
                        <div className="text-base font-semibold mt-0.5">{p.title}</div>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-[var(--text-dim)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}

        <Card className="bg-[var(--surface)]/50 border-dashed h-full">
          <div className="px-5 py-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-dim)]">
              <Building2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                탐색
              </div>
              <div className="text-base font-semibold mt-0.5">자유 탐색</div>
              <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                좌측 사이드바·⌘K로 원하는 페이지를 직접 둘러보세요.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
