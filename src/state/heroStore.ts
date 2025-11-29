// src/state/heroStore.ts
import { create } from "zustand";

interface HeroState {
  hero: any | null;

  setHero: (h: any) => void;
  loadHero: () => void;
  updateHero: (partial: any) => void;
  setStatus: (value: string) => void;
}

export const useHeroStore = create<HeroState>((set, get) => ({
  hero: null,

  setHero: (h) => set({ hero: h }),

  loadHero: () => {
    const current = localStorage.getItem("l2_current_user");
    if (!current) return;

    const username = JSON.parse(current);
    const accounts = JSON.parse(localStorage.getItem("l2_accounts_v2") || "[]");
    const acc = accounts.find((a: any) => a.username === username);

    if (acc && acc.hero) {
      set({ hero: acc.hero });
    }
  },

  updateHero: (partial) => {
    const prev = get().hero;
    if (!prev) return;

    const updated = { ...prev, ...partial };
    set({ hero: updated });

    const current = JSON.parse(localStorage.getItem("l2_current_user") || "null");
    if (!current) return;

    const accounts = JSON.parse(localStorage.getItem("l2_accounts_v2") || "[]");
    const accIndex = accounts.findIndex((a: any) => a.username === current);
    if (accIndex !== -1) {
      accounts[accIndex].hero = updated;
      localStorage.setItem("l2_accounts_v2", JSON.stringify(accounts));
    }
  },

  setStatus: (value) => {
    const { hero, updateHero } = get();
    if (!hero) return;

    updateHero({ status: value });
  },
}));
