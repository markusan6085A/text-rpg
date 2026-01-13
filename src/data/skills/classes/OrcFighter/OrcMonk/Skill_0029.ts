import { SkillDefinition } from "../../../types";

export const Skill_0029: SkillDefinition = {
  id: 29,
  code: "OM_0029",
  name: "Iron Punch",
  description: "Strikes target with a fist of iron. Usable when a fist weapon is equipped. Over-hit possible.\n\nНаносит удар кулаком железа. Используется при экипировке оружия для рукопашного боя. Возможен оверхит.",
  icon: "/skills/skill0029.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.604,
  cooldown: 15,
  effects: [],
  levels: [
    { level: 10, requiredLevel: 20, spCost: 2600, mpCost: 25, power: 105 },
    { level: 11, requiredLevel: 20, spCost: 2600, mpCost: 26, power: 113 },
    { level: 12, requiredLevel: 20, spCost: 2600, mpCost: 26, power: 123 },
    { level: 13, requiredLevel: 24, spCost: 3300, mpCost: 27, power: 143 },
    { level: 14, requiredLevel: 24, spCost: 3300, mpCost: 28, power: 154 },
    { level: 15, requiredLevel: 24, spCost: 3300, mpCost: 29, power: 166 },
    { level: 16, requiredLevel: 28, spCost: 5700, mpCost: 32, power: 193 },
    { level: 17, requiredLevel: 28, spCost: 5700, mpCost: 33, power: 207 },
    { level: 18, requiredLevel: 28, spCost: 5700, mpCost: 34, power: 222 },
    { level: 19, requiredLevel: 32, spCost: 9500, mpCost: 37, power: 256 },
    { level: 20, requiredLevel: 32, spCost: 9500, mpCost: 37, power: 274 },
    { level: 21, requiredLevel: 32, spCost: 9500, mpCost: 38, power: 293 },
    { level: 22, requiredLevel: 36, spCost: 13000, mpCost: 41, power: 334 },
    { level: 23, requiredLevel: 36, spCost: 13000, mpCost: 42, power: 357 },
    { level: 24, requiredLevel: 36, spCost: 13000, mpCost: 44, power: 380 },
  ],
};

