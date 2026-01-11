import { SkillDefinition } from "../../../types";

export const Skill_0227: SkillDefinition = {
  id: 227,
  code: "WR_0227",
  name: "Light Armor Mastery",
  description: "Increases P. Def. and Evasion when wearing light armor. -\n\nУвеличивает физ. защиту и уклонение при ношении легкой брони.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "pDef", mode: "percent" }],
  stackType: "light_armor_mastery",
  stackOrder: 1,
  icon: "/skills/Skill0227_0.jpg",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1900, mpCost: 0, power: 4.2 },
    { level: 2, requiredLevel: 20, spCost: 1900, mpCost: 0, power: 5.3 },
    { level: 3, requiredLevel: 24, spCost: 3200, mpCost: 0, power: 6.5 },
    { level: 4, requiredLevel: 24, spCost: 3200, mpCost: 0, power: 7.7 },
    { level: 5, requiredLevel: 32, spCost: 4000, mpCost: 0, power: 9 },
    { level: 6, requiredLevel: 32, spCost: 4000, mpCost: 0, power: 9.9 },
    { level: 7, requiredLevel: 32, spCost: 4000, mpCost: 0, power: 10.8 },
    { level: 8, requiredLevel: 36, spCost: 6100, mpCost: 0, power: 12.7 },
    { level: 9, requiredLevel: 36, spCost: 6100, mpCost: 0, power: 13.7 },
    { level: 10, requiredLevel: 36, spCost: 6100, mpCost: 0, power: 14.8 },
    { level: 11, requiredLevel: 36, spCost: 10000, mpCost: 0, power: 16.9 },
    { level: 12, requiredLevel: 36, spCost: 10000, mpCost: 0, power: 18 },
    { level: 13, requiredLevel: 36, spCost: 10000, mpCost: 0, power: 19.1 },
  ],
};

