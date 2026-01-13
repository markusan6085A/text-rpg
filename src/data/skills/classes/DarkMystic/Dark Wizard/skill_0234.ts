import { SkillDefinition } from "../../../types";

// Robe Mastery - 41 levels from XML (passive)
// pDef values: 1.7, 2.7, 4.3, 5.4, 7.2, 8.5, 10.6, 12.1, 14.5, 15.3, 16.2, 17.9, 18.8, 19.8, 21.7, 22.7, 23.7, 25.8, 26.8, 27.9, 30.1, 31.2, 32.4, 33.5, 34.7, 35.9, 37.1, 38.4, 39.6, 40.8, 42.1, 43.4, 44.7, 45.9, 47.3, 48.6, 49.9, 51.2, 52.5, 53.9, 55.2
const pDefValues = [1.7, 2.7, 4.3, 5.4, 7.2, 8.5, 10.6, 12.1, 14.5, 15.3, 16.2, 17.9, 18.8, 19.8, 21.7, 22.7, 23.7, 25.8, 26.8, 27.9, 30.1, 31.2, 32.4, 33.5, 34.7, 35.9, 37.1, 38.4, 39.6, 40.8, 42.1, 43.4, 44.7, 45.9, 47.3, 48.6, 49.9, 51.2, 52.5, 53.9, 55.2];

export const skill_0234: SkillDefinition = {
  id: 234,
  code: "DW_0234",
  name: "Robe Mastery",
  description: "Increases P. Def. when wearing a robe.\n\nУвеличивает физическую защиту в одежде типа Robe на 1.7-55.2.",
  icon: "/skills/Skill0234_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "pDef", mode: "flat" }], // Only applies when wearing Robe (handled by game logic)
  levels: pDefValues.map((pDef, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 20 : index < 4 ? 25 : index < 6 ? 30 : index < 8 ? 35 : index < 10 ? 40 : index < 12 ? 45 : index < 15 ? 50 : index < 20 ? 55 : index < 25 ? 60 : index < 30 ? 65 : index < 35 ? 70 : 75,
    spCost: index < 2 ? 1600 : index < 4 ? 2900 : index < 6 ? 5500 : index < 8 ? 9300 : index < 10 ? 15000 : index < 12 ? 25000 : index < 15 ? 40000 : index < 20 ? 60000 : index < 25 ? 80000 : index < 30 ? 100000 : index < 35 ? 120000 : 150000,
    mpCost: 0,
    power: pDef,
  })),
};

