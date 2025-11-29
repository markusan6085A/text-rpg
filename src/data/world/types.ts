// src/data/world/types.ts

// Моб у світі
export interface Mob {
  id: string;
  name: string;
  level: number;
  hp: number;
  exp: number;
  adenaMin: number;
  adenaMax: number;
  /**
   * Загальний шанс того, що з моба щось впаде (ресурс/ітем),
   * конкретні предмети описані в game/drop.ts
   */
  dropChance: number; // 0..1 (0.25 = 25%)
}

// Окрестность / локація
export interface Zone {
  id: string;
  name: string;
  cityId: string;
  minLevel: number;
  maxLevel: number;
  tpCost: number;
  mobs: Mob[];
}

// Город (як у GK)
export interface City {
  id: string;
  name: string;
  tpCost: number;
}

// Город з підключеними зонами — для WORLD у Battle.tsx
export interface WorldCity extends City {
  zones: Zone[];
}
