import { SkillDefinition } from "../../../types";

// Final Fortress для DarkAvenger (рівні 1-11)
export const skill_0291: SkillDefinition = {
  id: 291,
  code: "DAV_0291",
  name: "Final Fortress",
  description: "Automatically increases P. Def. when HP level falls.\n\nАвтоматически увеличивает физ. защиту на 116.9-215.8 (зависит от уровня), когда HP падает ниже 20%. Пассивный навык.",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  icon: "/skills/skill0291.gif",
  hpThreshold: 0.2,
  effects: [
    { stat: "pDef", mode: "flat" }, // value буде взято з levelDef.power
  ],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 120000, mpCost: 0, power: 116.9 },
    { level: 2, requiredLevel: 55, spCost: 150000, mpCost: 0, power: 129 },
    { level: 3, requiredLevel: 58, spCost: 200000, mpCost: 0, power: 141.6 },
    { level: 4, requiredLevel: 60, spCost: 270000, mpCost: 0, power: 150.4 },
    { level: 5, requiredLevel: 62, spCost: 330000, mpCost: 0, power: 159.3 },
    { level: 6, requiredLevel: 64, spCost: 370000, mpCost: 0, power: 168.4 },
    { level: 7, requiredLevel: 66, spCost: 580000, mpCost: 0, power: 177.7 },
    { level: 8, requiredLevel: 68, spCost: 650000, mpCost: 0, power: 187 },
    { level: 9, requiredLevel: 70, spCost: 780000, mpCost: 0, power: 196.5 },
    { level: 10, requiredLevel: 72, spCost: 1200000, mpCost: 0, power: 206.2 },
    { level: 11, requiredLevel: 74, spCost: 1900000, mpCost: 0, power: 215.8 },
  ],
};

