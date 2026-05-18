"use client";

import { useEffect } from "react";
import { useRecent, type RecentItem } from "@/stores/recent";

export function RecentTracker(props: Omit<RecentItem, "ts">) {
  const push = useRecent((s) => s.push);
  useEffect(() => {
    push(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.href]);
  return null;
}
