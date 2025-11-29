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
 * Зараз — тільки Floran Overlord.
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
        damageMultiplier: 1.0,
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
        damageMultiplier: 1.6,
        attackSpeedMultiplier: 1.2,
        skillChance: 0.5,
        description:
          "Енрейдж: бʼє по топ-DPS, дуже боляче, часто юзає ульт.",
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
