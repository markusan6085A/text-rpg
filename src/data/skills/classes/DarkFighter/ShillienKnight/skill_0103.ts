import { SkillDefinition } from "../../../types";

// Corpse Plague - corpse emits a cloud that poisons nearby enemies
export const skill_0103: SkillDefinition = {
  id: 103,
  code: "SK_0103",
  name: "Corpse Plague",
  description: "Corpse emits a cloud that poisons nearby enemies. Instantly poisons nearby enemies.\n\nТруп испускает облако, которое отравляет ближайших врагов. Мгновенно отравляет ближайших врагов.",
  icon: "/skills/skill0103.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 1.5,
  cooldown: 20,
  duration: 30,
  chance: 35, // Success rate depends on MEN stat
  hpPerTick: -240, // Level 1: 155 HP per 5 sec, Level 2: 190 HP, Level 3: 220 HP, Level 4: 240 HP (using max value)
  tickInterval: 5, // Every 5 seconds
  effects: [],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 40000, mpCost: 42, power: 0 },
    { level: 2, requiredLevel: 58, spCost: 140000, mpCost: 54, power: 0 },
    { level: 3, requiredLevel: 64, spCost: 240000, mpCost: 58, power: 0 },
    { level: 4, requiredLevel: 70, spCost: 510000, mpCost: 65, power: 0 },
  ],
};

