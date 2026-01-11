import { SkillDefinition } from "../../../types";

// Robe Mastery - 41 levels from XML (passive)
// pDef: 7.2, 8.6, 11.0, 12.7, 15.4, 17.4, 20.5, 22.7, 26.3, 27.6, 28.8, 31.5, 32.9, 34.2, 37.1, 38.6, 40.1, 43.2, 44.8, 46.4, 49.8, 51.5, 53.2, 54.9, 56.7, 58.5, 60.3, 62.1, 64.0, 65.9, 67.7, 69.7, 71.6, 73.5, 75.5, 77.4, 79.4, 81.4, 83.4, 85.4, 87.4
const robePDef = [7.2, 8.6, 11.0, 12.7, 15.4, 17.4, 20.5, 22.7, 26.3, 27.6, 28.8, 31.5, 32.9, 34.2, 37.1, 38.6, 40.1, 43.2, 44.8, 46.4, 49.8, 51.5, 53.2, 54.9, 56.7, 58.5, 60.3, 62.1, 64.0, 65.9, 67.7, 69.7, 71.6, 73.5, 75.5, 77.4, 79.4, 81.4, 83.4, 85.4, 87.4];

export const skill_0235: SkillDefinition = {
  id: 235,
  code: "DMO_0235",
  name: "Robe Mastery",
  description: "Improves physical defense when wearing robe-type armor.\n\nУлучшает физ. защиту при ношении мантии.",
  icon: "/skills/skill0235.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "pDef", mode: "flat" }], // Only when wearing Magic armor
  levels: robePDef.map((pDef, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 20 : index < 5 ? 25 : index < 8 ? 30 : index < 12 ? 35 : index < 16 ? 40 : index < 20 ? 45 : index < 24 ? 50 : index < 28 ? 55 : index < 32 ? 60 : index < 36 ? 65 : 70,
    spCost: index < 2 ? 1600 : index < 5 ? 3200 : index < 8 ? 5800 : index < 12 ? 12000 : index < 16 ? 25000 : index < 20 ? 50000 : index < 24 ? 80000 : index < 28 ? 120000 : index < 32 ? 160000 : index < 36 ? 200000 : 250000,
    mpCost: 0,
    power: pDef,
  })),
};


