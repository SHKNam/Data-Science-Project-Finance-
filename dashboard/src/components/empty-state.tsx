import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/40 px-6 py-12 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-dim)]">
        <Inbox size={20} />
      </div>
      <div className="mt-3 text-sm font-medium">{title}</div>
      {description && (
        <p className="mt-1 text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
