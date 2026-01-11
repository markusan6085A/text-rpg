import { SkillDefinition } from "../../../types";

// Sword Blunt Mastery для HumanKnight (рівні 1-8)
export const skill_0217: SkillDefinition = {
  id: 217,
  code: "HK_0217",
  name: "Sword Blunt Mastery",
  description: "Increases P. Atk. when using a sword or blunt weapon.\n\nУвеличивает физ. атаку на 1.5-76.4 (зависит от уровня) при использовании меча или тупого оружия. Пассивный навык.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "pAtk", mode: "flat" }],
  stackType: "sword_blunt_mastery",
  stackOrder: 1,
  icon: "/skills/skill0217.gif",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4700, mpCost: 0, power: 1.5 },
    { level: 2, requiredLevel: 24, spCost: 10000, mpCost: 0, power: 3.1 },
    { level: 3, requiredLevel: 28, spCost: 6000, mpCost: 0, power: 4.1 },
    { level: 4, requiredLevel: 28, spCost: 6000, mpCost: 0, power: 5.2 },
    { level: 5, requiredLevel: 32, spCost: 13000, mpCost: 0, power: 6.5 },
    { level: 6, requiredLevel: 32, spCost: 13000, mpCost: 0, power: 7.9 },
    { level: 7, requiredLevel: 36, spCost: 19000, mpCost: 0, power: 9.4 },
    { level: 8, requiredLevel: 36, spCost: 19000, mpCost: 0, power: 11.1 },
  ],
};

