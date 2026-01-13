/**
 * Типи для героя
 */
import type { CombatStats } from "../utils/stats/calcCombatStats";

export interface HeroBaseStats {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIT: number;
  MEN: number;
}

export interface HeroInventoryItem {
  id: string;
  name: string;
  type?: string;
  kind?: string; // Для сумісності з heroFactory
  slot: string;
  icon?: string;
  description?: string;
  stats?: any;
  count?: number;
  enchantLevel?: number; // Рівень заточки предмета (0-25+)
  armorType?: "light" | "heavy" | "robe" | "magic" | "none" | "pet"; // Тип броні для пасивних скілів
  grade?: "NG" | "D" | "C" | "B" | "A" | "S"; // Грейд предмета
}

export interface LearnedSkill {
  id: number;
  level: number;
}

export interface HeroResources {
  hp: number;
  mp: number;
  cp: number;
  maxHp: number;
  maxMp: number;
  maxCp: number;
}

export interface Hero {
  // Базова інформація
  id: string;
  name: string;
  username?: string;
  race: string;
  klass: string;
  profession?: string;
  gender: string;

  // Рівень та досвід
  level: number;
  exp: number;
  sp: number;
  expCurrent?: number; // Для сумісності з компонентами
  expToNext?: number;
  expPercent?: number;

  // Стати
  baseStats: HeroBaseStats;
  baseStatsInitial?: HeroBaseStats; // Оригінальні базові стати (не змінюються)
  battleStats: CombatStats;

  // Ресурси
  hp: number;
  mp: number;
  cp: number;
  maxHp: number;
  maxMp: number;
  maxCp: number;

  // Екіпіровка та інвентар
  equipment: Record<string, string | null>;
  inventory: HeroInventoryItem[];
  equipmentEnchantLevels?: Record<string, number>; // Рівні заточки для екіпірованих предметів (ключ - слот)

  // Скіли
  skills: LearnedSkill[];

  // Валюта
  adena: number;
  coinOfLuck?: number;
  aa?: number; // Ancient Adena (Adena Adena)

  // Інше
  buffs?: unknown[];
  status?: string;

  // Квести
  activeQuests?: Array<{
    questId: string;
    progress: Record<string, number>;
  }>;
  completedQuests?: string[]; // Масив ID завершених квестів

  // Зарич - унікальна зброя
  zaricheEquippedUntil?: number; // Timestamp коли Зарич буде знятий (1 година після одягання)

  // Склад
  warehouseCapacity?: number; // Поточна місткість складу (за замовчуванням 100)

  // Щоденні завдання
  dailyQuestsProgress?: Record<string, number>; // questId -> progress value
  dailyQuestsCompleted?: string[]; // Масив ID завершених щоденних завдань
  dailyQuestsResetDate?: string; // Дата останнього скидання (YYYY-MM-DD)

  // Преміум аккаунт
  premiumUntil?: number; // Timestamp до якого діє преміум аккаунт

  // Краски (dyes) - активні краски нанесені на персонажа
  activeDyes?: Array<{
    id: string; // ID краски (itemId)
    statPlus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
    statMinus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
    effect: number; // +1, +2, +3, +4, +5
    grade: "D" | "C" | "B" | "A" | "S";
    price: number; // Ціна для розрахунку вартості зняття (30%)
  }>;
}
