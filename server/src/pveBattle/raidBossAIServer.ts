/**
 * Копія src/data/ai/raidBossAI.ts для серверного PvE (фази, стан пригнічення).
 * При зміні профілів на клієнті — варто синхронізувати тут.
 */

export type RaidTargetStrategy = "nearest" | "highestDps" | "random";

export interface RaidBossPhase {
  fromHpPercent: number;
  toHpPercent: number;
  damageMultiplier: number;
  attackSpeedMultiplier: number;
  skillChance: number;
  stunChance?: number;
  stunDuration?: number;
  blockBuffsAndSkillsChance?: number;
  blockDuration?: number;
  description: string;
}

export interface RaidBossAIProfile {
  id: string;
  name: string;
  targetStrategy: RaidTargetStrategy;
  enrageAtPercent: number;
  phases: RaidBossPhase[];
}

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
        description: "Зла фаза: сильніші удари, частіші масові скіли по пати.",
      },
      {
        fromHpPercent: 30,
        toHpPercent: 0,
        damageMultiplier: 3.6,
        attackSpeedMultiplier: 2.2,
        skillChance: 0.5,
        description: "Енрейдж: бʼє по топ-DPS, дуже боляче, часто юзає ульт.",
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
        stunChance: 0.15,
        stunDuration: 2,
        blockBuffsAndSkillsChance: 0.1,
        blockDuration: 5,
        description: "Спокійна фаза: базові удари, інколи stun або блокування.",
      },
      {
        fromHpPercent: 50,
        toHpPercent: 0,
        damageMultiplier: 3.5,
        attackSpeedMultiplier: 1.3,
        skillChance: 0.35,
        stunChance: 0.25,
        stunDuration: 2,
        blockBuffsAndSkillsChance: 0.2,
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
        stunChance: 0.2,
        stunDuration: 2,
        blockBuffsAndSkillsChance: 0.15,
        blockDuration: 5,
        description: "Спокійна фаза: базові удари, інколи stun або блокування.",
      },
      {
        fromHpPercent: 50,
        toHpPercent: 0,
        damageMultiplier: 4.0,
        attackSpeedMultiplier: 1.5,
        skillChance: 0.4,
        stunChance: 0.3,
        stunDuration: 2,
        blockBuffsAndSkillsChance: 0.25,
        blockDuration: 5,
        description: "Зла фаза: дуже сильні удари, часто stun та блокування.",
      },
    ],
  },
];

export function getRaidBossAIProfile(id: string): RaidBossAIProfile | undefined {
  const resolved = id === "rb_floran_ai" ? "rb_floran_overlord_ai" : id;
  return RAID_BOSS_AI_PROFILES.find((p) => p.id === resolved);
}

const ALLOWED_IDS = new Set(RAID_BOSS_AI_PROFILES.map((p) => p.id));

export function isValidRaidAiProfileId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  const trimmed = id.trim();
  const resolved = trimmed === "rb_floran_ai" ? "rb_floran_overlord_ai" : trimmed;
  return ALLOWED_IDS.has(resolved);
}
