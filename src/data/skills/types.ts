export type SkillLevelDefinition = {
  level: number;
  requiredLevel: number;
  spCost: number;
  mpCost: number;
  power: number;
  hpCost?: number; // HP cost to cast the skill at this level (overrides skill-level hpCost if provided)
};

import type { SkillEffectModifier } from "./types/modifiers";
import type { SkillScope, SkillTarget } from "./types/targets";
import type { SkillStat } from "./types/stats";
import type { SkillTrigger } from "./types/triggers";

export type SkillDefinition = {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  type?: "active" | "passive";

  category?:
    | "physical_attack"
    | "magic_attack"
    | "heal"
    | "buff"
    | "passive"
    | "toggle"
    | "debuff"
    | "special"
    | "none";

  powerType?: "damage" | "percent" | "flat" | "multiplier" | "none";
  element?: "fire" | "water" | "wind" | "earth" | "holy" | "dark";
  castTime?: number; // seconds
  cooldown?: number; // seconds
  duration?: number; // seconds
  target?: SkillTarget; // default by category
  scope?: SkillScope; // default by category
  stackType?: string; // L2-style stack id
  stackOrder?: number; // higher wins
  buffGroup?: string; // Group for buff stacking logic (e.g., "WC_COMBAT", "WC_STATS", "WC_DEF", "WC_RESIST", "WC_SPECIAL")
  toggle?: boolean;
  mpPerTick?: number;
  hpPerTick?: number;
  cpPerTick?: number;
  tickInterval?: number; // seconds
  chance?: number; // default land rate for effects, 0-100
  effects?: SkillEffectModifier[];
  triggers?: SkillTrigger[];
  hpThreshold?: number; // HP threshold in percent (0-1), skill activates when HP falls below this threshold
  hpCost?: number; // HP cost to cast the skill

  // Умови для пасивних скілів (тільки для category: "passive")
  requiresArmor?: "light" | "heavy" | "robe"; // Скіл працює тільки якщо надіта відповідна броня
  requiresWeapon?: "sword" | "bow" | "staff" | "club" | "dagger" | "polearm" | "fist" | "dualsword" | "dualdagger"; // Скіл працює тільки якщо екіпірована відповідна зброя

  levels: SkillLevelDefinition[];
};
