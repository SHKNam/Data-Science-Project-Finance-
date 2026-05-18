import type { Metadata } from "next";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { CompareTray } from "@/components/compare-tray";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ShortcutsListener } from "@/components/shortcuts-listener";
import "./globals.css";

export const metadata: Metadata = {
  title: "DART 금융 분석 대시보드",
  description:
    "한국 상장기업 791사의 재무건전성·업종 클러스터·이상탐지·공시 시계열 분석을 한 곳에서.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <NuqsAdapter>
          <div className="flex min-h-screen">
            <AppSidebar />
            <main className="flex-1 ml-0 lg:ml-64 transition-all">
              <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-6 lg:py-10">
                {children}
              </div>
            </main>
          </div>
          <Suspense>
            <CommandPalette />
            <ShortcutsListener />
            <CompareTray />
            <OnboardingTour />
          </Suspense>
        </NuqsAdapter>
      </body>
    </html>
  );
}
