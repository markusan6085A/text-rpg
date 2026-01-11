import { SkillDefinition } from "../../../types";

// Aegis - provides defense from all directions when a shield is equipped
export const skill_0316: SkillDefinition = {
  id: 316,
  code: "SK_0316",
  name: "Aegis",
  description: "Provides defense from all directions when a shield is equipped.\n\nОбеспечивает защиту со всех сторон при экипировке щита.",
  icon: "/skills/skill0316.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "shieldDef", mode: "percent", value: 100 }, // 100% defense from all directions
  ],
  levels: [
    { level: 1, requiredLevel: 60, spCost: 180000, mpCost: 0, power: 0 },
  ],
};

