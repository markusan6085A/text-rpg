import { SkillDefinition } from "../../../types";

// Light Armor Mastery - 41 levels from XML (passive)
// pDef: 5.4, 6.3, 7.8, 8.8, 10.9, 12.5, 15.0, 16.9, 19.8, 20.8, 21.8, 24.0, 25.1, 26.3, 28.6, 29.8, 31, 33.6, 34.9, 36.2, 38.9, 40.3, 41.7, 43.1, 44.6, 46, 47.5, 49, 50.5, 52.1, 53.6, 55.2, 56.7, 58.3, 59.9, 61.5, 63.1, 64.7, 66.4, 68.0, 69.6
// Also multiplies mAtkSpd by 1.91 and pAtkSpd by 1.25 when wearing Light armor
const lightPDef = [5.4, 6.3, 7.8, 8.8, 10.9, 12.5, 15.0, 16.9, 19.8, 20.8, 21.8, 24.0, 25.1, 26.3, 28.6, 29.8, 31, 33.6, 34.9, 36.2, 38.9, 40.3, 41.7, 43.1, 44.6, 46, 47.5, 49, 50.5, 52.1, 53.6, 55.2, 56.7, 58.3, 59.9, 61.5, 63.1, 64.7, 66.4, 68.0, 69.6];

export const skill_0236: SkillDefinition = {
  id: 236,
  code: "DMO_0236",
  name: "Light Armor Mastery",
  description: "Improves defenses, casting speed, attack speed, and MP regeneration while wearing light armor.\n\nУлучшает защиту, скорость каста, скорость атаки и восстановление MP при ношении легкой брони.",
  icon: "/skills/Skill0236_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" },
    { stat: "castSpeed", mode: "multiplier", multiplier: 1.91 }, // Only when wearing Light armor
    { stat: "attackSpeed", mode: "multiplier", multiplier: 1.25 }, // Only when wearing Light armor
    { stat: "mpRegen", mode: "multiplier", multiplier: 1.2 }, // From XML
  ],
  levels: lightPDef.map((pDef, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 20 : index < 5 ? 25 : index < 8 ? 30 : index < 12 ? 35 : index < 16 ? 40 : index < 20 ? 45 : index < 24 ? 50 : index < 28 ? 55 : index < 32 ? 60 : index < 36 ? 65 : 70,
    spCost: index < 2 ? 1600 : index < 5 ? 3200 : index < 8 ? 5800 : index < 12 ? 12000 : index < 16 ? 25000 : index < 20 ? 50000 : index < 24 ? 80000 : index < 28 ? 120000 : index < 32 ? 160000 : index < 36 ? 200000 : 250000,
    mpCost: 0,
    power: pDef,
  })),
};


