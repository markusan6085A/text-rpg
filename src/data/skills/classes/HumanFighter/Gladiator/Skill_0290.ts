import { SkillDefinition } from "../../../types";

// Final Frenzy    .    HP.
export const Skill_0290: SkillDefinition = {
  id: 290,
  code: "GL_0290",
  name: "Final Frenzy",
  description: "Automatically increases P. Atk when HP level falls.\n\nАвтоматически увеличивает физ. атаку на 32.9-129.3 (зависит от уровня), когда HP падает ниже 30%. Пассивный навык.",
  category: "passive",
  powerType: "flat",
  icon: "/skills/0290.jpg",
  effects: [{ stat: "pAtk", mode: "flat" }],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 32000, mpCost: 0, power: 32.9 },
    { level: 2, requiredLevel: 46, spCost: 43000, mpCost: 0, power: 39.4 },
    { level: 3, requiredLevel: 49, spCost: 61000, mpCost: 0, power: 46.6 },
    { level: 4, requiredLevel: 52, spCost: 100000, mpCost: 0, power: 54.6 },
    { level: 5, requiredLevel: 55, spCost: 46000, mpCost: 0, power: 63.3 },
    { level: 6, requiredLevel: 58, spCost: 153000, mpCost: 0, power: 72.7 },
    { level: 7, requiredLevel: 60, spCost: 181000, mpCost: 0, power: 79.3 },
    { level: 8, requiredLevel: 62, spCost: 250000, mpCost: 0, power: 86.1 },
    { level: 9, requiredLevel: 64, spCost: 320000, mpCost: 0, power: 93.1 },
    { level: 10, requiredLevel: 66, spCost: 410000, mpCost: 0, power: 100.2 },
    { level: 11, requiredLevel: 68, spCost: 510000, mpCost: 0, power: 107.5 },
    { level: 12, requiredLevel: 70, spCost: 580000, mpCost: 0, power: 114.8 },
    { level: 13, requiredLevel: 72, spCost: 800000, mpCost: 0, power: 122.1 },
    { level: 14, requiredLevel: 74, spCost: 1630000, mpCost: 0, power: 129.3 },
  ],
};

