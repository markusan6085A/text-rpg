import { SkillDefinition } from "../../../types";

// Stun Shot - stunning attack that inflicts shock and damage
export const skill_0101: SkillDefinition = {
  id: 101,
  code: "ES_0101",
  name: "Stun Shot",
  description: "Stunning attack that inflicts shock and damage simultaneously by shooting an arrow into a target. Usable when equipped with a bow. Over-hit possible.\n\nОглушающая атака, которая одновременно наносит шок и урон, стреляя стрелой в цель. Используется при экипировке лука. Сила 287-326 (зависит от уровня). Возможен оверхит. Шанс оглушения 50% (зависит от CON цели). Длительность 9 сек.",
  icon: "/skills/skill0101.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 10,
  duration: 9, // Stun duration
  chance: 50, // Success rate depends on CON stat
  effects: [
    { stat: "shockResist", mode: "multiplier", multiplier: 0 }, // Stuns target
  ],
  levels: [
    { level: 1, requiredLevel: 36, spCost: 8600, mpCost: 69, power: 287 },
    { level: 2, requiredLevel: 36, spCost: 8600, mpCost: 72, power: 306 },
    { level: 3, requiredLevel: 36, spCost: 8600, mpCost: 74, power: 326 },
  ],
};

