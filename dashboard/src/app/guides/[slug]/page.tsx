import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { NextSteps } from "@/components/next-steps";
import { GUIDES } from "@/lib/narrative";

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function GuidePage(
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) notFound();

  const otherGuides = GUIDES.filter((g) => g.slug !== slug).slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={guide.persona.toUpperCase()}
        title={guide.title}
        description={guide.description}
        back={{ href: "/guides", label: "가이드 목록" }}
        actions={
          <Badge variant="primary">
            <Clock size={11} /> {guide.estimated_time}
          </Badge>
        }
      />

      <ol className="space-y-3">
        {guide.steps.map((s, i) => (
          <li key={i}>
            <Card className="overflow-hidden">
              <div className="px-5 py-5 flex items-start gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-semibold flex items-center justify-center text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--text-muted)] leading-relaxed">
                    {s.body}
                  </p>
                  {s.cta && (
                    <div className="mt-3">
                      <Link href={s.cta.href}>
                        <Button variant="primary" size="sm">
                          {s.cta.label} <ChevronRight size={12} />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <NextSteps
        steps={otherGuides.map((g) => ({
          href: `/guides/${g.slug}`,
          title: g.title,
          description: g.description,
          icon: ArrowRight,
        }))}
      />
    </>
  );
}
