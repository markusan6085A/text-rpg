import { SkillDefinition } from "../../../types";

export const Skill_0255: SkillDefinition = {
  id: 255,
  code: "WR_0255",
  name: "Power Smash",
  description: "Harness a mighty power to smite foes down with. Usable when a sword or blunt weapon is equipped. Power 90. Over-hit possible.\n\nИспользует могучую силу для сокрушения врагов. Используется при экипировке меча или тупого оружия. Сила 90. Возможен оверхит.",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  cooldown: 3,
  icon: "/skills/0255.jpg",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1200, mpCost: 19, power: 90 },
    { level: 2, requiredLevel: 20, spCost: 1200, mpCost: 20, power: 97 },
    { level: 3, requiredLevel: 20, spCost: 1200, mpCost: 20, power: 105 },
    { level: 4, requiredLevel: 24, spCost: 2100, mpCost: 21, power: 123 },
    { level: 5, requiredLevel: 24, spCost: 2100, mpCost: 22, power: 132 },
    { level: 6, requiredLevel: 24, spCost: 2100, mpCost: 23, power: 143 },
    { level: 7, requiredLevel: 28, spCost: 4000, mpCost: 25, power: 165 },
    { level: 8, requiredLevel: 28, spCost: 4000, mpCost: 26, power: 177 },
    { level: 9, requiredLevel: 28, spCost: 4000, mpCost: 27, power: 191 },
    { level: 10, requiredLevel: 32, spCost: 6100, mpCost: 28, power: 219 },
    { level: 11, requiredLevel: 32, spCost: 6100, mpCost: 28, power: 235 },
    { level: 12, requiredLevel: 32, spCost: 6100, mpCost: 29, power: 251 },
    { level: 13, requiredLevel: 36, spCost: 10000, mpCost: 32, power: 287 },
    { level: 14, requiredLevel: 36, spCost: 10000, mpCost: 33, power: 306 },
    { level: 15, requiredLevel: 36, spCost: 10000, mpCost: 34, power: 326 },
  ],
};

