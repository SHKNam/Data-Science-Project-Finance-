"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecentItem = {
  href: string;
  label: string;
  kind: "company" | "model" | "page";
  ts: number;
};

type State = {
  items: RecentItem[];
  push: (item: Omit<RecentItem, "ts">) => void;
  clear: () => void;
};

export const useRecent = create<State>()(
  persist(
    (set) => ({
      items: [],
      push: (it) =>
        set((s) => {
          const filtered = s.items.filter((x) => x.href !== it.href);
          return {
            items: [{ ...it, ts: Date.now() }, ...filtered].slice(0, 10),
          };
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "dart-recent" },
  ),
);
