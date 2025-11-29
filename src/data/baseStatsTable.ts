import type { HeroBaseStats } from "../types/Hero";

export const baseStatsTable: Record<string, HeroBaseStats> = {
  "Человек:Воин": { STR: 12, DEX: 11, CON: 11, INT: 6, WIT: 7, MEN: 8 },
  "Человек:Маг":  { STR: 7, DEX: 9, CON: 9, INT: 12, WIT: 11, MEN: 11 },

  "Эльф:Воин":    { STR: 11, DEX: 12, CON: 10, INT: 7, WIT: 8, MEN: 9 },
  "Эльф:Маг":     { STR: 6, DEX: 10, CON: 10, INT: 13, WIT: 12, MEN: 12 },

  "Тёмный эльф:Воин": { STR: 12, DEX: 11, CON: 9, INT: 8, WIT: 7, MEN: 7 },
  "Тёмный эльф:Маг":  { STR: 7, DEX: 11, CON: 9, INT: 14, WIT: 11, MEN: 10 },

  "Орк:Воин":     { STR: 14, DEX: 10, CON: 13, INT: 5, WIT: 6, MEN: 7 },
  "Орк:Маг":      { STR: 7, DEX: 7, CON: 13, INT: 12, WIT: 8, MEN: 14 },

  "Гном:Воин":    { STR: 13, DEX: 10, CON: 12, INT: 6, WIT: 7, MEN: 8 }
};

export function getBaseStats(race: string, klass: string): HeroBaseStats {
  return baseStatsTable[`${race}:${klass}`];
}
