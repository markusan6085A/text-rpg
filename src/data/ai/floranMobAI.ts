// src/data/ai/floranMobAI.ts
import type { Mob } from "../world/types";

export type MobRole = "melee" | "archer" | "mage" | "tank" | "support" | "boss";

export interface MobAIProfile {
  id: string;
  role: MobRole;
  /**
   * target: кого бʼємо
   *  - "nearest"        — найближча ціль
   *  - "lowestHp"       — найменше HP
   *  - "highestDps"     — хто більше всього дамажить
   */
  targetStrategy: "nearest" | "lowestHp" | "highestDps";

  /**
   * attackRange:
   *  - "melee"          — рукопашка
   *  - "ranged"         — лук/маг
   */
  attackRange: "melee" | "ranged";

  /**
   * chanceToUseSkill: 0..1 — шанс використати "умовний" активний скіл замість автоатаки.
   */
  chanceToUseSkill: number;
}

/**
 * Базові AI-профілі, якими користуватиметься Floran.
 */
export const FLORAN_AI_PROFILES: MobAIProfile[] = [
  {
    id: "fl_melee_basic",
    role: "melee",
    targetStrategy: "nearest",
    attackRange: "melee",
    chanceToUseSkill: 0.15,
  },
  {
    id: "fl_archer_basic",
    role: "archer",
    targetStrategy: "lowestHp",
    attackRange: "ranged",
    chanceToUseSkill: 0.25,
  },
  {
    id: "fl_mage_basic",
    role: "mage",
    targetStrategy: "highestDps",
    attackRange: "ranged",
    chanceToUseSkill: 0.35,
  },
  {
    id: "fl_tank_basic",
    role: "tank",
    targetStrategy: "nearest",
    attackRange: "melee",
    chanceToUseSkill: 0.10,
  },
  {
    id: "fl_support_basic",
    role: "support",
    targetStrategy: "lowestHp",
    attackRange: "ranged",
    chanceToUseSkill: 0.30,
  },
  {
    id: "fl_champion_ai",
    role: "boss",
    targetStrategy: "highestDps",
    attackRange: "melee",
    chanceToUseSkill: 0.45,
  },
];

/** Витягнути готовий AI-профіль по id */
export function getFloranAIProfile(id: string): MobAIProfile | undefined {
  return FLORAN_AI_PROFILES.find((p) => p.id === id);
}

/**
 * Примітивний аналіз назви моба, щоб визначити його роль.
 * Не ідеально, але для offline-іграшки — саме те.
 */
export function detectMobRoleFromName(mob: Mob): MobRole {
  const name = mob.name.toLowerCase();

  if (name.startsWith("[champion]") || name.startsWith("[чемпион]")) {
    return "boss";
  }

  if (
    name.includes("archer") ||
    name.includes("ranger") ||
    name.includes("bow") ||
    name.includes("crossbow")
  ) {
    return "archer";
  }

  if (
    name.includes("magus") ||
    name.includes("mage") ||
    name.includes("wizard") ||
    name.includes("sorcerer") ||
    name.includes("warlock") ||
    name.includes("shaman")
  ) {
    return "mage";
  }

  if (
    name.includes("knight") ||
    name.includes("paladin") ||
    name.includes("templar") ||
    name.includes("guard") ||
    name.includes("warlord") ||
    name.includes("golem")
  ) {
    return "tank";
  }

  if (
    name.includes("cleric") ||
    name.includes("priest") ||
    name.includes("monk") ||
    name.includes("support")
  ) {
    return "support";
  }

  // дефолт – рукопашка
  return "melee";
}

/**
 * Головна функція для боївки:
 * за мобом визначаємо, який AI-профіль йому видати.
 */
export function getFloranMobAI(mob: Mob): MobAIProfile {
  const role = detectMobRoleFromName(mob);

  if (role === "boss") {
    return FLORAN_AI_PROFILES.find((p) => p.id === "fl_champion_ai")!;
  }

  if (role === "archer") {
    return FLORAN_AI_PROFILES.find((p) => p.id === "fl_archer_basic")!;
  }

  if (role === "mage") {
    return FLORAN_AI_PROFILES.find((p) => p.id === "fl_mage_basic")!;
  }

  if (role === "tank") {
    return FLORAN_AI_PROFILES.find((p) => p.id === "fl_tank_basic")!;
  }

  if (role === "support") {
    return FLORAN_AI_PROFILES.find((p) => p.id === "fl_support_basic")!;
  }

  // дефолт: melee
  return FLORAN_AI_PROFILES.find((p) => p.id === "fl_melee_basic")!;
}
