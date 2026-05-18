import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto py-16">
      <div className="text-center mb-10 animate-fade-up">
        <div className="text-[120px] font-bold tracking-tight text-[var(--text-dim)] leading-none">
          404
        </div>
        <h1 className="text-2xl font-semibold mt-4">길을 잃으신 것 같습니다</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          요청한 페이지를 찾을 수 없습니다. 잘못된 corp_code(8자리 문자열) 또는
          삭제된 페이지일 수 있습니다.
        </p>
      </div>

      <Card className="mb-4">
        <div className="px-5 py-4 flex items-center gap-3">
          <Search size={16} className="text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-muted)] flex-1">⌘K로 빠르게 검색</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link href="/">
          <Button variant="primary" className="w-full">
            <Home size={14} /> 홈으로
          </Button>
        </Link>
        <Link href="/guides">
          <Button variant="outline" className="w-full">
            <Compass size={14} /> 시나리오 가이드
          </Button>
        </Link>
      </div>
    </div>
  );
}
