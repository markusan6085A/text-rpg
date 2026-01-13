// src/data/drop/raidBossDrops.ts

// Типи для дропа РБ
export interface RaidDropItem {
  itemId: string;
  min: number;
  max: number;
  chance: number; // 0..1
}

export interface RaidDropProfile {
  id: string;
  items: RaidDropItem[];
}

/**
 * Профілі дропа рейд-босів.
 * Тут зараз тільки Floran Overlord, але потім додамо інших.
 */
export const RAID_BOSS_DROP_PROFILES: RaidDropProfile[] = [
  {
    id: "rb_floran_overlord_drop",
    items: [
      // гарантована адена
      { itemId: "adena", min: 500_000, max: 900_000, chance: 1.0 },

      // хороші ресурси
      { itemId: "b_armor_piece", min: 8, max: 16, chance: 0.70 },
      { itemId: "b_weapon_piece", min: 6, max: 12, chance: 0.65 },
      { itemId: "enchant_armor_b", min: 1, max: 2, chance: 0.40 },
      { itemId: "enchant_weapon_b", min: 1, max: 1, chance: 0.30 },

      // готові речі B-grade (4-8%)
      { itemId: "b_heavy_set", min: 1, max: 1, chance: 0.08 }, // 8%
      { itemId: "b_light_set", min: 1, max: 1, chance: 0.07 }, // 7%
      { itemId: "b_robe_set", min: 1, max: 1, chance: 0.07 },  // 7%
      { itemId: "b_two_handed_sword", min: 1, max: 1, chance: 0.06 }, // 6%
      { itemId: "b_bow", min: 1, max: 1, chance: 0.05 },               // 5%
      { itemId: "b_staff", min: 1, max: 1, chance: 0.05 },             // 5%

      // трохи «фанового» лута
      { itemId: "cosmetic_floran_cloak", min: 1, max: 1, chance: 0.01 }, // 1%
      { itemId: "cosmetic_floran_hat", min: 1, max: 1, chance: 0.015 },  // 1.5%
    ],
  },
];

/** Дістати профіль дропа РБ по id (наприклад "rb_floran_overlord_drop") */
export function getRaidBossDropProfile(
  id: string,
): RaidDropProfile | undefined {
  return RAID_BOSS_DROP_PROFILES.find((p) => p.id === id);
}
