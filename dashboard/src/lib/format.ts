export function fmtNumber(n: number | null | undefined, digits = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtPercent(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function fmtFloat(n: number | null | undefined, digits = 3): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(1)}조`;
  if (abs >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
  if (abs >= 1e4) return `${(n / 1e4).toFixed(1)}만`;
  return fmtNumber(n);
}

export function gradeColor(grade: string | null | undefined): string {
  switch (grade) {
    case "우량":
      return "text-emerald-400";
    case "보통":
      return "text-blue-400";
    case "주의":
      return "text-amber-400";
    case "위험":
      return "text-red-400";
    default:
      return "text-zinc-400";
  }
}

export function gradeBg(grade: string | null | undefined): string {
  switch (grade) {
    case "우량":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
    case "보통":
      return "bg-blue-500/10 text-blue-300 border-blue-500/20";
    case "주의":
      return "bg-amber-500/10 text-amber-300 border-amber-500/20";
    case "위험":
      return "bg-red-500/10 text-red-300 border-red-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

export function zoneLabel(zone: string | null | undefined): string {
  switch (zone) {
    case "safe":
      return "안전";
    case "grey":
      return "회색";
    case "distress":
      return "위험";
    default:
      return "—";
  }
}
