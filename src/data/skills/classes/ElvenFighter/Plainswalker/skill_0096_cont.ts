import { SkillDefinition } from "../../../types";

// Bleed - continuation from Elven Scout (lv.3-6)
export const skill_0096_cont: SkillDefinition = {
  id: 96,
  code: "PW_0096",
  name: "Bleed",
  description: "Inflicts a serious wound that causes the enemy to bleed momentarily. Usable when a dagger is equipped. Effect 5-8.\n\nНаносит серьезную рану, вызывающую кровотечение. Используется при экипировке кинжала. Наносит 110-170 HP урона каждые 5 сек в течение 20 сек. Шанс 100% (зависит от CON цели).",
  icon: "/skills/skill0096.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.08,
  cooldown: 13,
  duration: 20, // Bleed duration
  chance: 100, // Success rate depends on CON stat
  tickInterval: 5, // Every 5 seconds
  effects: [],
  levels: [
    { level: 3, requiredLevel: 49, spCost: 75000, mpCost: 67, power: 110 }, // 110 HP damage per 5 sec
    { level: 4, requiredLevel: 58, spCost: 200000, mpCost: 81, power: 135 }, // 135 HP damage per 5 sec
    { level: 5, requiredLevel: 66, spCost: 640000, mpCost: 93, power: 155 }, // 155 HP damage per 5 sec
    { level: 6, requiredLevel: 70, spCost: 850000, mpCost: 99, power: 170 }, // 170 HP damage per 5 sec
  ],
};

