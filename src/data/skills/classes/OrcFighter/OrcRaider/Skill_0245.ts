import { SkillDefinition } from "../../../types";

export const Skill_0245: SkillDefinition = {
  id: 245,
  code: "OR_0245",
  name: "Wild Sweep",
  description: "Strike multiple enemies while equiping a pole-arm. Power 90. Over-hit possible.\n\nАтакует нескольких врагов копьем. Возможен оверхит. Сила 90.",
  icon: "/skills/skill0245.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 1.08,
  cooldown: 17,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1100, mpCost: 22, power: 90 },
    { level: 2, requiredLevel: 20, spCost: 1100, mpCost: 22, power: 97 },
    { level: 3, requiredLevel: 20, spCost: 1100, mpCost: 22, power: 105 },
    { level: 4, requiredLevel: 24, spCost: 1800, mpCost: 23, power: 123 },
    { level: 5, requiredLevel: 24, spCost: 1800, mpCost: 24, power: 132 },
    { level: 6, requiredLevel: 24, spCost: 1800, mpCost: 25, power: 143 },
    { level: 7, requiredLevel: 28, spCost: 3600, mpCost: 27, power: 165 },
    { level: 8, requiredLevel: 28, spCost: 3600, mpCost: 29, power: 177 },
    { level: 9, requiredLevel: 28, spCost: 3600, mpCost: 30, power: 191 },
    { level: 10, requiredLevel: 32, spCost: 5600, mpCost: 31, power: 219 },
    { level: 11, requiredLevel: 32, spCost: 5600, mpCost: 31, power: 235 },
    { level: 12, requiredLevel: 32, spCost: 5600, mpCost: 33, power: 251 },
    { level: 13, requiredLevel: 36, spCost: 8600, mpCost: 35, power: 287 },
    { level: 14, requiredLevel: 36, spCost: 8600, mpCost: 36, power: 306 },
    { level: 15, requiredLevel: 36, spCost: 8600, mpCost: 37, power: 326 },
  ],
};

