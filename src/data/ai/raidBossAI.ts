// src/data/ai/raidBossAI.ts

export type RaidTargetStrategy = "nearest" | "highestDps" | "random";

export interface RaidBossPhase {
  /** hp% від і до, наприклад 100–60, 60–30, 30–0 */
  fromHpPercent: number;
  toHpPercent: number;

  /** множники до базового дамагу та швидкості атаки */
  damageMultiplier: number;
  attackSpeedMultiplier: number;

  /** шанс використати сильний скіл замість автоатаки */
  skillChance: number;

  /** Шанс застосувати stun на гравця (0-1) */
  stunChance?: number;
  /** Тривалість stun в секундах */
  stunDuration?: number;

  /** Шанс заблокувати бафи та скіли гравця (0-1) */
  blockBuffsAndSkillsChance?: number;
  /** Тривалість блокування в секундах */
  blockDuration?: number;

  description: string;
}

export interface RaidBossAIProfile {
  id: string;
  name: string;
  targetStrategy: RaidTargetStrategy;
  enrageAtPercent: number; // нижче цього % НЕРФ/ЕНРЕЙД
  phases: RaidBossPhase[];
}

/**
 * Базові AI-профілі для рейд-босів.
 */
export const RAID_BOSS_AI_PROFILES: RaidBossAIProfile[] = [
  {
    id: "rb_floran_overlord_ai",
    name: "Floran Overlord AI",
    targetStrategy: "highestDps",
    enrageAtPercent: 20,
    phases: [
      {
        fromHpPercent: 100,
        toHpPercent: 60,
        damageMultiplier: 3.0,
        attackSpeedMultiplier: 1.0,
        skillChance: 0.25,
        description: "Спокійна фаза: базові удари, інколи AoE.",
      },
      {
        fromHpPercent: 60,
        toHpPercent: 30,
        damageMultiplier: 1.3,
        attackSpeedMultiplier: 1.1,
        skillChance: 0.35,
        description:
          "Зла фаза: сильніші удари, частіші масові скіли по пати.",
      },
      {
        fromHpPercent: 30,
        toHpPercent: 0,
        damageMultiplier: 3.6,
        attackSpeedMultiplier: 2.2,
        skillChance: 0.5,
        description:
          "Енрейдж: бʼє по топ-DPS, дуже боляче, часто юзає ульт.",
      },
    ],
  },
  {
    id: "rb_dg_darkwood_lord_ai",
    name: "Ancient Darkwood Lord AI",
    targetStrategy: "nearest",
    enrageAtPercent: 30,
    phases: [
      {
        fromHpPercent: 100,
        toHpPercent: 50,
        damageMultiplier: 2.5,
        attackSpeedMultiplier: 1.0,
        skillChance: 0.2,
        stunChance: 0.15, // 15% шанс stun на 2 сек
        stunDuration: 2,
        blockBuffsAndSkillsChance: 0.1, // 10% шанс блокування на 5 сек
        blockDuration: 5,
        description: "Спокійна фаза: базові удари, інколи stun або блокування.",
      },
      {
        fromHpPercent: 50,
        toHpPercent: 0,
        damageMultiplier: 3.5,
        attackSpeedMultiplier: 1.3,
        skillChance: 0.35,
        stunChance: 0.25, // 25% шанс stun на 2 сек
        stunDuration: 2,
        blockBuffsAndSkillsChance: 0.2, // 20% шанс блокування на 5 сек
        blockDuration: 5,
        description: "Зла фаза: сильніші удари, частіше stun та блокування.",
      },
    ],
  },
  {
    id: "rb_dg_shadow_archon_ai",
    name: "Shadow Archon AI",
    targetStrategy: "nearest",
    enrageAtPercent: 30,
    phases: [
      {
        fromHpPercent: 100,
        toHpPercent: 50,
        damageMultiplier: 3.0,
        attackSpeedMultiplier: 1.1,
        skillChance: 0.25,
        stunChance: 0.2, // 20% шанс stun на 2 сек
        stunDuration: 2,
        blockBuffsAndSkillsChance: 0.15, // 15% шанс блокування на 5 сек
        blockDuration: 5,
        description: "Спокійна фаза: базові удари, інколи stun або блокування.",
      },
      {
        fromHpPercent: 50,
        toHpPercent: 0,
        damageMultiplier: 4.0,
        attackSpeedMultiplier: 1.5,
        skillChance: 0.4,
        stunChance: 0.3, // 30% шанс stun на 2 сек
        stunDuration: 2,
        blockBuffsAndSkillsChance: 0.25, // 25% шанс блокування на 5 сек
        blockDuration: 5,
        description: "Зла фаза: дуже сильні удари, часто stun та блокування.",
      },
    ],
  },
];

/** Дістати AI-профіль рейд-боса по id (наприклад "rb_floran_overlord_ai") */
export function getRaidBossAIProfile(
  id: string,
): RaidBossAIProfile | undefined {
  return RAID_BOSS_AI_PROFILES.find((p) => p.id === id);
}
