"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const SEEN_KEY = "dart-onboarding-seen";

export function OnboardingTour() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SEEN_KEY)) return;

    const timer = setTimeout(() => {
      const d = driver({
        showProgress: true,
        nextBtnText: "다음 →",
        prevBtnText: "← 이전",
        doneBtnText: "시작하기",
        animate: true,
        steps: [
          {
            element: "body",
            popover: {
              title: "DART 금융 분석 대시보드에 오신 것을 환영합니다",
              description:
                "한국 상장기업 791사의 재무건전성·클러스터·이상탐지·공시 시계열을 한 곳에서 봅니다. 30초 투어를 진행합니다.",
            },
          },
          {
            element: "[data-onboarding=sidebar-nav]",
            popover: {
              title: "좌측 사이드바",
              description:
                "탐색·페이즈·도구·참고 4개 그룹으로 정리. 페이즈 옆 숫자는 사용된 모델 수입니다.",
            },
          },
          {
            element: "[data-onboarding=search-trigger]",
            popover: {
              title: "어디서나 ⌘K로 검색",
              description: "기업명·모델·페이지를 빠르게 찾아 이동합니다.",
            },
          },
          {
            element: "[data-onboarding=persona-cards]",
            popover: {
              title: "역할별 빠른 시작",
              description:
                "리스크 분석가·투자자·데이터 사이언티스트·연구자·경영진 — 자신에게 맞는 경로로 시작하세요.",
            },
          },
        ],
        onDestroyed: () => {
          localStorage.setItem(SEEN_KEY, "1");
        },
      });
      d.drive();
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
