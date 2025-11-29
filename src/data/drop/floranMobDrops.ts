// src/data/drop/floranMobDrops.ts
import type { Mob } from "../world/types";

// Локальні типи для дропа (тільки для цього файлу)
export interface DropItem {
  itemId: string;
  min: number;
  max: number;
  chance: number; // 0..1
}

export interface DropProfile {
  id: string;
  items: DropItem[];
}

/**
 * Профілі дропа для звичайних мобів і чемпіонів у районі Floran.
 * Ідея: не привʼязуватись до кожного mob.id руками, а визначати дроп по:
 *  - рівню моба
 *  - чи це Champion (по назві)
 */
export const FLORAN_MOB_DROP_PROFILES: DropProfile[] = [
  // ===== ЗВИЧАЙНІ Моби =====
  {
    id: "fl_normal_low", // ~1–15
    items: [
      { itemId: "adena", min: 50, max: 150, chance: 1.0 },
      { itemId: "ng_sword_piece", min: 1, max: 3, chance: 0.12 },
      { itemId: "ng_armor_piece", min: 1, max: 3, chance: 0.12 },
      { itemId: "soulshot_ng", min: 20, max: 60, chance: 0.35 },
      { itemId: "spiritshot_ng", min: 15, max: 45, chance: 0.28 },
      { itemId: "low_potion_hp", min: 1, max: 3, chance: 0.30 },
    ],
  },
  {
    id: "fl_normal_mid", // ~16–30
    items: [
      { itemId: "adena", min: 150, max: 400, chance: 1.0 },
      { itemId: "d_weapon_piece", min: 1, max: 2, chance: 0.10 },
      { itemId: "d_armor_piece", min: 1, max: 3, chance: 0.14 },
      { itemId: "soulshot_d", min: 40, max: 80, chance: 0.40 },
      { itemId: "spiritshot_d", min: 30, max: 70, chance: 0.33 },
      { itemId: "medium_potion_hp", min: 1, max: 3, chance: 0.30 },
    ],
  },
  {
    id: "fl_normal_high", // ~31–44
    items: [
      { itemId: "adena", min: 400, max: 900, chance: 1.0 },
      { itemId: "c_weapon_piece", min: 1, max: 2, chance: 0.09 },
      { itemId: "c_armor_piece", min: 1, max: 3, chance: 0.15 },
      { itemId: "soulshot_c", min: 60, max: 120, chance: 0.40 },
      { itemId: "spiritshot_c", min: 50, max: 110, chance: 0.35 },
      { itemId: "elixir_hp_small", min: 1, max: 2, chance: 0.25 },
    ],
  },
  {
    id: "fl_normal_top", // ~45–52
    items: [
      { itemId: "adena", min: 900, max: 1800, chance: 1.0 },
      { itemId: "b_weapon_piece", min: 1, max: 2, chance: 0.09 },
      { itemId: "b_armor_piece", min: 1, max: 3, chance: 0.16 },
      { itemId: "soulshot_b", min: 80, max: 160, chance: 0.42 },
      { itemId: "spiritshot_b", min: 70, max: 150, chance: 0.36 },
      { itemId: "elixir_hp_medium", min: 1, max: 2, chance: 0.26 },
    ],
  },

  // ===== CHAMPION-и =====
  {
    id: "fl_champion_low", // чемпи 8–25
    items: [
      { itemId: "adena", min: 800, max: 1500, chance: 1.0 },
      { itemId: "ng_weapon", min: 1, max: 1, chance: 0.08 },
      { itemId: "d_weapon_piece", min: 2, max: 4, chance: 0.25 },
      { itemId: "d_armor_piece", min: 3, max: 6, chance: 0.30 },
      { itemId: "soulshot_d", min: 120, max: 220, chance: 0.60 },
      { itemId: "spiritshot_d", min: 90, max: 190, chance: 0.50 },
    ],
  },
  {
    id: "fl_champion_mid", // чемпи 26–40
    items: [
      { itemId: "adena", min: 1500, max: 2800, chance: 1.0 },
      { itemId: "d_weapon", min: 1, max: 1, chance: 0.10 },
      { itemId: "c_weapon_piece", min: 3, max: 6, chance: 0.28 },
      { itemId: "c_armor_piece", min: 4, max: 8, chance: 0.32 },
      { itemId: "soulshot_c", min: 160, max: 280, chance: 0.60 },
      { itemId: "spiritshot_c", min: 140, max: 260, chance: 0.52 },
    ],
  },
  {
    id: "fl_champion_high", // чемпи 41–50
    items: [
      { itemId: "adena", min: 2500, max: 4000, chance: 1.0 },
      { itemId: "c_weapon", min: 1, max: 1, chance: 0.12 },
      { itemId: "b_weapon_piece", min: 3, max: 6, chance: 0.30 },
      { itemId: "b_armor_piece", min: 4, max: 8, chance: 0.34 },
      { itemId: "soulshot_b", min: 200, max: 340, chance: 0.65 },
      { itemId: "spiritshot_b", min: 180, max: 320, chance: 0.55 },
    ],
  },
];

/** Хелпер, щоб дістати профіль по id */
export function getFloranDropProfile(id: string): DropProfile | undefined {
  return FLORAN_MOB_DROP_PROFILES.find((p) => p.id === id);
}

/**
 * Визначаємо id профілю дропа для конкретного моба Floran.
 * Логіка:
 *  - якщо Champion (name починається з "[Champion]") → champion-профілі
 *  - інакше → звичайні профілі по рівню
 */
export function getFloranMobDropProfileId(mob: Mob): string {
  const isChampion = mob.name.startsWith("[Champion]");

  if (isChampion) {
    if (mob.level <= 25) return "fl_champion_low";
    if (mob.level <= 40) return "fl_champion_mid";
    return "fl_champion_high";
  }

  // Звичайні моби
  if (mob.level <= 15) return "fl_normal_low";
  if (mob.level <= 30) return "fl_normal_mid";
  if (mob.level <= 44) return "fl_normal_high";
  return "fl_normal_top";
}

/**
 * Зручною функцією Battle може скористатись так:
 *   const profile = getFloranMobDropProfile(mob);
 */
export function getFloranMobDropProfile(
  mob: Mob,
): DropProfile | undefined {
  const id = getFloranMobDropProfileId(mob);
  return getFloranDropProfile(id);
}
