"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CompareType = "company" | "model";

export type CompareItem = {
  id: string;
  label: string;
  type: CompareType;
};

type State = {
  items: CompareItem[];
  add: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
};

export const useCompare = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          if (s.items.some((x) => x.id === item.id)) return s;
          // 같은 type만 허용
          const sameType = s.items.filter((x) => x.type === item.type);
          if (sameType.length >= 5) return s;
          const cleared = s.items.filter((x) => x.type === item.type);
          return { items: [...cleared, item] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((x) => x.id === id),
    }),
    { name: "dart-compare" },
  ),
);
