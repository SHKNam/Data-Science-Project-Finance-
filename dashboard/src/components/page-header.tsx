import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  description,
  back,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 animate-fade-up">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] mb-3 transition-colors"
        >
          <ArrowLeft size={12} /> {back.label}
        </Link>
      )}
      {eyebrow && (
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--primary)] font-semibold mb-2">
          {eyebrow}
        </div>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text)]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-[var(--text-muted)] max-w-3xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
