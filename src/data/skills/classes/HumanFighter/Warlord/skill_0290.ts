import { SkillDefinition } from "../../../types";

export const skill_0290: SkillDefinition = {
  id: 290,
  code: "WL_0290",
  name: "Final Frenzy",
  description: "Automatically increases P. Atk when HP level falls.\n\nАвтоматически увеличивает физ. атаку на 32.9-129.3 (зависит от уровня), когда HP падает ниже 30%. Пассивный навык.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  icon: "/skills/skill0290.gif",
  hpThreshold: 0.4, // Activates when HP falls below 40%
  effects: [{ stat: "pAtk", mode: "flat" }],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 46000, mpCost: 0, power: 32.9 },
    { level: 2, requiredLevel: 46, spCost: 55000, mpCost: 0, power: 39.4 },
    { level: 3, requiredLevel: 49, spCost: 89000, mpCost: 0, power: 46.6 },
    { level: 4, requiredLevel: 52, spCost: 150000, mpCost: 0, power: 54.6 },
    { level: 5, requiredLevel: 55, spCost: 180000, mpCost: 0, power: 63.3 },
    { level: 6, requiredLevel: 58, spCost: 210000, mpCost: 0, power: 72.7 },
    { level: 7, requiredLevel: 60, spCost: 320000, mpCost: 0, power: 79.3 },
    { level: 8, requiredLevel: 62, spCost: 400000, mpCost: 0, power: 86.1 },
    { level: 9, requiredLevel: 64, spCost: 530000, mpCost: 0, power: 93.1 },
    { level: 10, requiredLevel: 66, spCost: 700000, mpCost: 0, power: 100.2 },
    { level: 11, requiredLevel: 68, spCost: 780000, mpCost: 0, power: 107.5 },
    { level: 12, requiredLevel: 70, spCost: 850000, mpCost: 0, power: 114.8 },
    { level: 13, requiredLevel: 72, spCost: 1700000, mpCost: 0, power: 122.1 },
    { level: 14, requiredLevel: 74, spCost: 2100000, mpCost: 0, power: 129.3 },
  ],
};

