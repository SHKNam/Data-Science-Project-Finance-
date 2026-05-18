"use client";

import Link from "next/link";
import { AlertOctagon, Home, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto py-16">
      <div className="text-center mb-10 animate-fade-up">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/15 flex items-center justify-center text-red-400">
          <AlertOctagon size={28} />
        </div>
        <h1 className="text-2xl font-semibold mt-6">예기치 않은 오류가 발생했습니다</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)] max-w-md mx-auto">
          페이지를 렌더링하는 중 문제가 생겼습니다. 새로고침으로 해결되지
          않는다면 데이터 export를 다시 실행해 보세요.
        </p>
      </div>

      {error.message && (
        <Card className="mb-4 bg-red-500/5 border-red-500/30">
          <div className="px-5 py-3">
            <div className="text-[10px] uppercase tracking-wider text-red-300 mb-1">오류 메시지</div>
            <div className="text-xs font-mono text-red-200">{error.message}</div>
            {error.digest && (
              <div className="text-[10px] text-[var(--text-dim)] mt-1 font-mono">
                digest: {error.digest}
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button variant="primary" onClick={reset} className="w-full">
          <RefreshCw size={14} /> 다시 시도
        </Button>
        <Link href="/">
          <Button variant="outline" className="w-full">
            <Home size={14} /> 홈으로
          </Button>
        </Link>
      </div>
    </div>
  );
}
