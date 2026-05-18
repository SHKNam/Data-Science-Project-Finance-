import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "outline" | "ghost" | "primary";
type Size = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const variants: Record<Variant, string> = {
    default: "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)]",
    outline: "bg-transparent text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-2)]",
    ghost: "bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
    primary: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 border border-transparent font-medium",
  };
  const sizes: Record<Size, string> = {
    sm: "h-7 px-2.5 text-xs",
    md: "h-9 px-3.5 text-sm",
    lg: "h-10 px-4 text-sm",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
