"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WatchlistItem = {
  corp_code: string;
  corp_name: string;
  added_at: string;
  note?: string;
};

type State = {
  items: WatchlistItem[];
  has: (corp_code: string) => boolean;
  toggle: (corp_code: string, corp_name: string) => void;
  remove: (corp_code: string) => void;
  setNote: (corp_code: string, note: string) => void;
  clear: () => void;
};

export const useWatchlist = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      has: (cc) => get().items.some((x) => x.corp_code === cc),
      toggle: (cc, name) =>
        set((s) =>
          s.items.some((x) => x.corp_code === cc)
            ? { items: s.items.filter((x) => x.corp_code !== cc) }
            : {
                items: [
                  { corp_code: cc, corp_name: name, added_at: new Date().toISOString() },
                  ...s.items,
                ],
              },
        ),
      remove: (cc) =>
        set((s) => ({ items: s.items.filter((x) => x.corp_code !== cc) })),
      setNote: (cc, note) =>
        set((s) => ({
          items: s.items.map((x) => (x.corp_code === cc ? { ...x, note } : x)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "dart-watchlist" },
  ),
);
