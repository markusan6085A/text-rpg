import type { HeroBaseStats } from "../types/Hero";

/**
 * Базові стати для 1 рівня (фіксовані значення)
 * Ці стати є базовими для розрахунку бойових параметрів
 */
export const baseStatsTable: Record<string, HeroBaseStats> = {
  // Воины (Fighters)
  "Человек:Воин": { STR: 40, DEX: 30, CON: 43, INT: 21, WIT: 11, MEN: 25 },
  "Эльф:Воин":    { STR: 36, DEX: 35, CON: 36, INT: 23, WIT: 14, MEN: 26 },
  "Темный Эльф:Воин": { STR: 41, DEX: 34, CON: 32, INT: 25, WIT: 12, MEN: 26 },
  "Тёмный эльф:Воин": { STR: 41, DEX: 34, CON: 32, INT: 25, WIT: 12, MEN: 26 }, // Аліас для сумісності
  "Орк:Воин":     { STR: 40, DEX: 26, CON: 47, INT: 18, WIT: 12, MEN: 27 },
  "Гном:Воин":    { STR: 39, DEX: 29, CON: 45, INT: 20, WIT: 10, MEN: 27 },

  // Мистики (Mystics)
  "Человек:Маг":  { STR: 22, DEX: 21, CON: 27, INT: 41, WIT: 20, MEN: 39 },
  "Эльф:Маг":     { STR: 21, DEX: 24, CON: 25, INT: 37, WIT: 23, MEN: 40 },
  "Темный Эльф:Маг":  { STR: 23, DEX: 23, CON: 24, INT: 44, WIT: 19, MEN: 37 },
  "Тёмный эльф:Маг":  { STR: 23, DEX: 23, CON: 24, INT: 44, WIT: 19, MEN: 37 }, // Аліас для сумісності
  "Орк:Маг":      { STR: 27, DEX: 24, CON: 31, INT: 31, WIT: 15, MEN: 42 },
};

export function getBaseStats(race: string, klass: string): HeroBaseStats {
  return baseStatsTable[`${race}:${klass}`];
}
