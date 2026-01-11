import { SkillDefinition } from "../../../types";

// Wild Sweep - 15 levels
// XML: power: 90 97 105 123 132 143 165 177 191 219 235 251 287 306 326
// mpConsume: 22 22 22 23 24 25 27 29 30 31 31 33 35 36 37
export const skill_0245: SkillDefinition = {
  id: 245,
  code: "SC_0245",
  name: "Wild Sweep",
  description: "Strike multiple enemies while equipping a pole-arm. Over-hit possible.\n\nАтакует нескольких врагов при использовании древкового оружия. Возможен оверхит.",
  icon: "/skills/skill0245.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 1.08,
  cooldown: 17,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1400, mpCost: 22, power: 90 },
    { level: 2, requiredLevel: 20, spCost: 1400, mpCost: 22, power: 97 },
    { level: 3, requiredLevel: 20, spCost: 1400, mpCost: 22, power: 105 },
    { level: 4, requiredLevel: 24, spCost: 2600, mpCost: 23, power: 123 },
    { level: 5, requiredLevel: 24, spCost: 2600, mpCost: 24, power: 132 },
    { level: 6, requiredLevel: 24, spCost: 2600, mpCost: 25, power: 143 },
    { level: 7, requiredLevel: 28, spCost: 4400, mpCost: 27, power: 165 },
    { level: 8, requiredLevel: 28, spCost: 4400, mpCost: 29, power: 177 },
    { level: 9, requiredLevel: 28, spCost: 4400, mpCost: 30, power: 191 },
    { level: 10, requiredLevel: 32, spCost: 8300, mpCost: 31, power: 219 },
    { level: 11, requiredLevel: 32, spCost: 8300, mpCost: 31, power: 235 },
    { level: 12, requiredLevel: 32, spCost: 8300, mpCost: 33, power: 251 },
    { level: 13, requiredLevel: 36, spCost: 11000, mpCost: 35, power: 287 },
    { level: 14, requiredLevel: 36, spCost: 11000, mpCost: 36, power: 306 },
    { level: 15, requiredLevel: 36, spCost: 11000, mpCost: 37, power: 326 },
  ],
};

