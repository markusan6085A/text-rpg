import type { SkillStat } from "./stats";

export type SkillEffectModifier = {
  stat: SkillStat;
  mode: "percent" | "flat" | "multiplier";
  value?: number; // if omitted, uses level.power (optionally scaled by multiplier)
  multiplier?: number; // scales level.power when value is omitted
  duration?: number; // seconds, overrides skill duration
  stackType?: string;
  stackOrder?: number;
  chance?: number; // 0-100, overrides skill chance
  resistStat?: SkillStat; // which resist stat to use (e.g., stunResist), falls back to debuffResist
};
