import { SkillDefinition } from "../../../types";

export const skill_1031: SkillDefinition = {
  id: 1031,
  code: "HM_1031",
  name: "Disrupt Undead",
  description: "Does damage to undead monsters. Power 19.\n\nНаносит урон нежити. Мощность 19-36 (зависит от уровня).",
  icon: "/skills/skill1031.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "holy",
  target: "enemy",
  scope: "single",
  castTime: 2.5,
  cooldown: 4,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1600, mpCost: 18, power: 19 },
    { level: 2, requiredLevel: 20, spCost: 1600, mpCost: 20, power: 21 },
    { level: 3, requiredLevel: 25, spCost: 3400, mpCost: 22, power: 24 },
    { level: 4, requiredLevel: 25, spCost: 3400, mpCost: 23, power: 25 },
    { level: 5, requiredLevel: 30, spCost: 6600, mpCost: 25, power: 28 },
    { level: 6, requiredLevel: 30, spCost: 6600, mpCost: 27, power: 30 },
    { level: 7, requiredLevel: 35, spCost: 11000, mpCost: 29, power: 33 },
    { level: 8, requiredLevel: 35, spCost: 11000, mpCost: 30, power: 36 },
  ],
};

