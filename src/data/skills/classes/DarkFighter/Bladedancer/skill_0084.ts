import { SkillDefinition } from "../../../types";

// Poison Blade Dance - sword emits cloud that instantly poisons nearby enemies
export const skill_0084: SkillDefinition = {
  id: 84,
  code: "BD_0084",
  name: "Poison Blade Dance",
  description: "Sword emits cloud that instantly poisons nearby enemies. Usable when a dual-sword is equipped. Effect 6.\n\nМеч испускает облако, которое мгновенно отравляет ближайших врагов. Доступно при экипировке парного меча. Эффект 6.",
  icon: "/skills/skill0084.gif",
  category: "debuff",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 1.833,
  cooldown: 60,
  duration: 30,
  chance: 35, // Success rate depends on MEN stat
  hpPerTick: -190, // Will be set from level
  tickInterval: 5,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 55, spCost: 200000, mpCost: 100, power: 1 },
    { level: 2, requiredLevel: 60, spCost: 320000, mpCost: 110, power: 1 },
    { level: 3, requiredLevel: 72, spCost: 1500000, mpCost: 133, power: 1 },
  ],
};

