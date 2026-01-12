// src/data/world/types.ts
import type { DropEntry } from "../combat/types";

// Моб у світі
export interface Mob {
  id: string;
  name: string;
  level: number;
  icon?: string; // Іконка моба
  
  // Ресурси
  hp: number;
  mp: number;  // MP моба (0 для фізичних, >0 для магів)
  
  // Бойові стати (в 2 рази більші ніж раніше обчислювались)
  pAtk: number;  // Фізична атака
  mAtk: number;   // Магічна атака (0 для фізичних мобів)
  pDef: number;  // Фізичний захист
  mDef: number;  // Магічний захист
  
  // Досвід та валюта
  exp: number;
  sp?: number;
  adenaMin: number;
  adenaMax: number;
  
  // Дроп та спойл
  dropChance: number; // 0..1 (0.25 = 25%) - загальний шанс дропа
  drops?: DropEntry[];  // Дроп предметів (опціонально, якщо потрібен спеціальний дроп)
  spoil?: DropEntry[];  // Спойл ресурси (опціонально, якщо моб має спойл)
  
  // Спеціальні властивості
  canDispelBuffs?: boolean; // Чи може моб зняти бафи з гравця (для катакомбних мобів)
  aggressiveGroup?: string; // Група агресивних мобів (якщо вказано, всі моби з цією групою на сторінці атакують одночасно)
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
  allMobsAggressive?: boolean; // Чи всі моби на сторінці атакують одночасно (для Floran Catacombs)
  curseChanceOnAttack?: number; // Шанс на прокляття при атаці (0..1, наприклад 0.1 = 10%)
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
