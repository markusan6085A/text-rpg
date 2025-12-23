// src/state/heroStore.ts
import { create } from "zustand";
import { itemsDB } from "../data/items/itemsDB";
import { getSkillDef } from "./battle/loadout";

export const INVENTORY_MAX_ITEMS = 100;

interface HeroState {
  hero: any | null;

  setHero: (h: any) => void;
  loadHero: () => void;
  updateHero: (partial: any) => void;
  setStatus: (value: string) => void;
  equipItem: (item: any) => void;
  unequipItem: (slot: string) => void;
  learnSkill: (skillId: number) => void;
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

  equipItem: (item) => {
    const { hero, updateHero } = get();
    if (!hero || !item) return;

    const slot = item.slot;
    if (!slot) return;

    // Запрещённые категории
    if (["all", "consumable", "resource", "quest", "book", "recipe"].includes(slot)) {
      return;
    }

    const currentEquipped = hero.equipment?.[slot] || null;
    let newInventory = [...(hero.inventory || [])].filter((i: any) => i.id !== item.id);

    // Если есть предмет, который был в этом слоте
    if (currentEquipped) {
      const oldItem = itemsDB[currentEquipped];
      if (oldItem) {
        newInventory.push({
          id: oldItem.id,
          name: oldItem.name,
          slot: oldItem.slot,
          kind: oldItem.kind,
          icon: oldItem.icon,
          description: oldItem.description,
          stats: oldItem.stats,
          count: 1,
        });
      }
    }

    const newEquipment = {
      ...(hero.equipment || {}),
      [slot]: item.id,
    };

    updateHero({
      inventory: newInventory,
      equipment: newEquipment,
    });
  },

  unequipItem: (slot) => {
    const { hero, updateHero } = get();
    if (!hero || !slot) return;

    const itemId = hero.equipment?.[slot];
    if (!itemId) return;

    const def = itemsDB[itemId];
    if (!def) return;

    const newInventory = [...(hero.inventory || [])];
    newInventory.push({
      id: def.id,
      name: def.name,
      slot: def.slot,
      kind: def.kind,
      icon: def.icon,
      description: def.description,
      stats: def.stats,
      count: 1,
    });

    const newEquipment = {
      ...(hero.equipment || {}),
      [slot]: null,
    };

    updateHero({
      equipment: newEquipment,
      inventory: newInventory,
    });
  },

  learnSkill: (skillId) => {
    const { hero, updateHero } = get();
    if (!hero) return;

    const skillDef = getSkillDef(skillId);
    if (!skillDef) return;

    const currentSkills = Array.isArray(hero.skills) ? hero.skills : [];
    const existing = currentSkills.find((s: any) => s.id === skillId);
    
    const levels = [...skillDef.levels].sort((a, b) => a.level - b.level);
    const currentLevel = existing?.level ?? 0;
    const nextLevelDef = levels.find((l) => l.level > currentLevel);
    
    if (!nextLevelDef) return; // Уже максимальный уровень

    const heroLevel = hero.level ?? 1;
    const requiredLevel = nextLevelDef.requiredLevel ?? 1;
    const spCost = nextLevelDef.spCost ?? 0;
    
    const heroSp = typeof hero.sp === "number" ? hero.sp : typeof (hero as any).SP === "number" ? (hero as any).SP : 0;

    if (heroLevel < requiredLevel || heroSp < spCost) {
      return; // Недостаточно уровня или SP
    }

    const newSp = heroSp - spCost;
    const newSkills = existing
      ? currentSkills.map((s: any) => (s.id === skillId ? { ...s, level: nextLevelDef.level } : s))
      : [...currentSkills, { id: skillId, level: nextLevelDef.level }];

    updateHero({
      skills: newSkills,
      sp: newSp,
    });
  },
}));
