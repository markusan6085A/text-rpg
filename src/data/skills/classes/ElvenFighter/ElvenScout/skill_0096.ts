import { SkillDefinition } from "../../../types";

// Bleed - inflicts serious wound that causes bleeding
export const skill_0096: SkillDefinition = {
  id: 96,
  code: "ES_0096",
  name: "Bleed",
  description: "Inflicts a serious wound that causes the enemy to bleed momentarily. Usable when a dagger is equipped.\n\nНаносит серьезную рану, вызывающую кровотечение. Используется при экипировке кинжала. Наносит 65-85 HP урона каждые 5 сек в течение 20 сек. Шанс 100% (зависит от CON цели).",
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
    { level: 1, requiredLevel: 24, spCost: 5000, mpCost: 32, power: 65 }, // 65 HP damage per 5 sec
    { level: 2, requiredLevel: 32, spCost: 15000, mpCost: 41, power: 85 }, // 85 HP damage per 5 sec
  ],
};

