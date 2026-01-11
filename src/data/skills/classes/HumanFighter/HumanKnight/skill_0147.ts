import { SkillDefinition } from "../../../types";

// Magic Resistance для HumanKnight (рівні 1-14)
export const skill_0147: SkillDefinition = {
  id: 147,
  code: "HK_0147",
  name: "Magic Resistance",
  description: "Increases M. Def.\n\nУвеличивает маг. защиту на 19-140 (зависит от уровня). Пассивный навык.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "mDef", mode: "flat" }],
  stackType: "magic_resistance",
  stackOrder: 1,
  icon: "/skills/skill0147.gif",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2300, mpCost: 0, power: 19 },
    { level: 2, requiredLevel: 20, spCost: 2300, mpCost: 0, power: 20 },
    { level: 3, requiredLevel: 24, spCost: 3300, mpCost: 0, power: 22 },
    { level: 4, requiredLevel: 24, spCost: 3300, mpCost: 0, power: 23 },
    { level: 5, requiredLevel: 24, spCost: 3300, mpCost: 0, power: 24 },
    { level: 6, requiredLevel: 28, spCost: 4000, mpCost: 0, power: 26 },
    { level: 7, requiredLevel: 28, spCost: 4000, mpCost: 0, power: 27 },
    { level: 8, requiredLevel: 28, spCost: 4000, mpCost: 0, power: 28 },
    { level: 9, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 30 },
    { level: 10, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 31 },
    { level: 11, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 32 },
    { level: 12, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 35 },
    { level: 13, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 36 },
    { level: 14, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 37 },
  ],
};


